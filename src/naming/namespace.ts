import type {ConfigPurpose, NameFactory} from '../types';

const DEFAULT_NAMESPACE = 'oliveryasuna';

/**
 * Namespaces are lowercase and slash-free so `parseName` can split on `/`
 * without ambiguity and names can never collide with a plugin prefix.
 */
const NAMESPACE_PATTERN: RegExp = /^[a-z][a-z0-9-]*$/;

const CONFIG_PURPOSES = (([
  'setup',
  'parser',
  'rules',
  'type-aware',
  'overrides',
  'overlay',
  'processor'
] as const) satisfies (readonly ConfigPurpose[]));

const PURPOSE_SET: ReadonlySet<string> = (new Set<string>(CONFIG_PURPOSES));

interface ParsedName {
  ns: string;
  module: string;
  purpose?: ConfigPurpose;
}

/**
 * Throws rather than returning a boolean: an invalid namespace is a build
 * error.
 */
const assertValidNamespace = ((ns: string): void => {
  if(!NAMESPACE_PATTERN.test(ns)) {
    throw (new TypeError(`invalid namespace ${JSON.stringify(ns)}: expected to match ${NAMESPACE_PATTERN.source}`));
  }
});

const buildName = ((
  ns: string,
  module: string,
  purpose?: ConfigPurpose
): string => {
  assertValidNamespace(ns);
  if(!module) {
    throw (new TypeError('config module segment must not be empty'));
  }

  return (purpose ? `${ns}/${module}/${purpose}` : `${ns}/${module}`);
});

/**
 * Produced once per factory invocation and threaded to every config module via
 * `ModuleContext`, so no module ever sees the raw namespace string.
 */
const createNameFactory = ((ns: string = DEFAULT_NAMESPACE): NameFactory => {
  assertValidNamespace(ns);

  return ((module: string, purpose?: ConfigPurpose): string => buildName(ns, module, purpose));
});

/**
 * Returns `null` for names this package did not emit — a consumer's own
 * configs, and third-party configs appended to the composer. `rulegen`
 * attributes those to the `external` module.
 */
const parseName = ((name: string): (ParsedName | null) => {
  const segments = name.split('/');
  if((segments.length < 2) || (segments.length > 3)) {
    return null;
  }

  const [
    ns,
    module,
    purpose
  ] = segments;
  if(!ns || !module || !NAMESPACE_PATTERN.test(ns)) {
    return null;
  }

  if((purpose !== undefined) && !PURPOSE_SET.has(purpose)) {
    return null;
  }

  return ((purpose === undefined)
    ? {
        ns: ns,
        module: module
      }
    : {
        ns: ns,
        module: module,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Correct.
        purpose: (purpose as ConfigPurpose)
      });
});

const isOwnedName = ((
  name: (string | undefined),
  ns: string
): boolean => (name ? (parseName(name)?.ns === ns) : false));

export type {
  ParsedName
};
export {
  DEFAULT_NAMESPACE,
  NAMESPACE_PATTERN,
  CONFIG_PURPOSES,
  assertValidNamespace,
  buildName,
  createNameFactory,
  parseName,
  isOwnedName
};

// TODO: Remove re-exports.
export type {
  NameFactory,
  ConfigPurpose
} from '../types';
