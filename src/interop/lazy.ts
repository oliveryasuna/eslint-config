import type {AnyParser, AnyPlugin, AnyProcessor, Awaitable, RuleOptions} from '../types';

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
      + `    npm i -D ${specifier}`),
      options
    );
  }

}

/** Unwraps a CommonJS interop default without unwrapping a plain object. */
const interopDefault = (async <T>(
  value: Awaitable<T>
): Promise<T extends {default: (infer U);} ? U : T> => {
  const resolved = ((await value) as (T & {default?: unknown;}));

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
    throw (new MissingPeerError(specifier, feature, {cause: err}));
  }
});

const loadPlugin = (async(
  specifier: string,
  feature: string
): Promise<AnyPlugin> => ((await load(specifier, feature)) as AnyPlugin));

const loadParser = (async(
  specifier: string,
  feature: string
): Promise<AnyParser> => ((await load(specifier, feature)) as AnyParser));

const loadProcessor = (async(
  specifier: string,
  feature: string
): Promise<AnyProcessor> => ((await load(specifier, feature)) as AnyProcessor));

/** Escape hatch for packages that are data rather than plugins, e.g. `globals`. */
const loadModule = (async <T>(
  specifier: string,
  feature: string
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
  interopDefault,
  loadPlugin,
  loadParser,
  loadProcessor,
  loadModule,
  configRules,
  loadAll
};
