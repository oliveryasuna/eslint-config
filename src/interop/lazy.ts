import type {AnyParser, AnyPlugin, AnyProcessor, Awaitable, RuleOptions} from '../types';
import {inspect} from 'node:util';

const MAX_CAUSE_DEPTH = 8;

/**
 * Renders a cause chain into the thrown message.
 *
 * ESLint prints only `error.message` and `error.stack`, never `error.cause`, so
 * a cause left on the property alone is invisible to the person running the
 * lint — which is the whole reason these errors exist.
 */
const formatCause = ((cause: unknown): string => {
  const lines: string[] = [];
  let current = cause;

  for(let depth = 0; ((current !== undefined) && (current !== null) && (depth < MAX_CAUSE_DEPTH)); depth++) {
    if(current instanceof Error) {
      lines.push(current.stack ?? `${current.name}: ${current.message}`);

      current = current.cause;
    } else {
      lines.push(inspect(current));

      break;
    }
  }

  return ((lines.length === 0)
    ? ''
    : `\n\nCaused by:\n${lines.join('\n\nCaused by:\n')}`);
});

class MissingPeerError extends Error {

  public override name = 'MissingPeerError';

  public constructor(
    public readonly specifier: string,
    public readonly feature: string,
    options?: {cause?: unknown;}
  ) {
    super(
      ((`"${specifier}" is required by the ${feature} config but is not installed.\n`
        + `Install it, or disable the module:  { ${feature}: false }\n`)
      + `    npm i -D ${specifier}`
      + formatCause(options?.cause)),
      options
    );
  }

}

/**
 * Thrown when a peer is installed but importing it fails, e.g. because one of
 * its* dependencies is unresolvable or its module graph throws on evaluation.
 *
 * Kept distinct from {@link MissingPeerError} so that a broken install is never
 * reported as a missing one.
 */
class PeerLoadError extends Error {

  public override name = 'PeerLoadError';

  public constructor(
    public readonly specifier: string,
    public readonly feature: string,
    options?: {cause?: unknown;}
  ) {
    super(
      (`"${specifier}" resolves but could not be loaded by the ${feature} config.\n`
        + 'This is a fault inside the package or its dependencies, not a missing install.'
        + formatCause(options?.cause)),
      options
    );
  }

}

const MODULE_NOT_FOUND_CODES: ReadonlySet<string> = (new Set([
  'ERR_MODULE_NOT_FOUND',
  'MODULE_NOT_FOUND'
]));

/**
 * Whether `specifier` resolves from this package, or `undefined` when the host
 * offers no `import.meta.resolve` to ask.
 */
const canResolve = ((specifier: string): (boolean | undefined) => {
  // Absent on hosts older than Node 20.6, hence the widened annotation.
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Correct.
  const resolve: (((specifier: string) => string) | undefined) = import.meta.resolve;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Correct.
  if(resolve === undefined) {
    return undefined;
  }

  try {
    resolve(specifier);

    return true;
  } catch{
    return false;
  }
});

/**
 * Whether a failed `import()` means `specifier` itself is absent, as opposed to
 * something *inside* it being absent.
 *
 * A plugin's own dependencies fail with the same error code, so the specifier
 * has to be resolved independently before blaming the caller's install.
 */
const isMissingModule = ((
  err: unknown,
  specifier: string
): boolean => {
  if(!(err instanceof Error)) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
  const code = (err as {code?: unknown;}).code;

  if((typeof code !== 'string') || !MODULE_NOT_FOUND_CODES.has(code)) {
    return false;
  }

  const resolvable = canResolve(specifier);

  if(resolvable !== undefined) {
    return !resolvable;
  }

  // Node and Bun both quote the offending specifier; a transitive failure
  // quotes the inner one, and bare paths in the message are never quoted.
  return (err.message.includes(`'${specifier}'`) || err.message.includes(`"${specifier}"`));
});

/** Unwraps a CommonJS interop default without unwrapping a plain object. */
const interopDefault = (async <T>(
  value: Awaitable<T>
): Promise<T extends {default: (infer U);} ? U : T> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
  const resolved = ((await value) as (T & {default?: unknown;}));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unnecessary-condition -- Correct.
  return (((resolved && (typeof resolved === 'object') && ('default' in resolved))
    ? resolved.default
    : resolved) as (T extends {default: (infer U);} ? U : T));
});

const load = (async(
  specifier: string,
  feature: string
): Promise<unknown> => {
  try {
    return (await interopDefault(import(/* @vite-ignore */ specifier)));
  } catch(err) {
    // Anything other than "no such module" is a fault in the peer itself, and
    // reporting it as an uninstalled peer would send the user chasing an
    // install that is already there.
    throw (isMissingModule(err, specifier)
      ? (new MissingPeerError(specifier, feature, {cause: err}))
      : (new PeerLoadError(specifier, feature, {cause: err})));
  }
});

const loadPlugin = (async(
  specifier: string,
  feature: string
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
): Promise<AnyPlugin> => ((await load(specifier, feature)) as AnyPlugin));

const loadParser = (async(
  specifier: string,
  feature: string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
): Promise<AnyParser> => ((await load(specifier, feature)) as AnyParser));

const loadProcessor = (async(
  specifier: string,
  feature: string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
): Promise<AnyProcessor> => ((await load(specifier, feature)) as AnyProcessor));

/** Escape hatch for packages that are data rather than plugins, e.g. `globals`. */
const loadModule = (async <T>(
  specifier: string,
  feature: string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
): Promise<T> => ((await load(specifier, feature)) as T));

/**
 * Extracts the rule record from a config a plugin ships, e.g.
 * `configRules(plugin.configs?.recommended)`.
 *
 * A flat-config `configs` entry may be a single config object or an array of
 * them, so there is no safe dotted access to `.rules`; arrays are merged in
 * order, last write winning.
 *
 * The return type is asserted, not verified. Nothing reached through
 * `AnyPlugin` is checked against the generated `RuleOptions`, and spreading the
 * result into a rule table suppresses no errors but validates no keys either —
 * which is why the config modules prefer literal rule tables to this.
 */
const configRules = ((config: unknown): Partial<RuleOptions> => {
  const items = (Array.isArray(config)
    ? config
    : [config]);
  const rules: Partial<RuleOptions> = {};

  for(const item of items) {
    if(item && (typeof item === 'object') && ('rules' in item)) {
      Object.assign(rules, item.rules);
    }
  }

  return rules;
});

const loadAll = (async(
  specifiers: string[],
  feature: string
): Promise<AnyPlugin[]> => Promise.all(specifiers.map(async specifier => loadPlugin(specifier, feature))));

export {
  MissingPeerError,
  PeerLoadError,
  interopDefault,
  loadPlugin,
  loadParser,
  loadProcessor,
  loadModule,
  configRules,
  loadAll
};
