import type {RuleOptions, TypedFlatConfigItem} from '../types';

const isConfigObject = ((value: unknown): value is TypedFlatConfigItem =>
  ((typeof value === 'object') && (value !== null) && !Array.isArray(value)));

/** Accepts an object, an array, or an arbitrarily nested array; returns a flat array. */
const asConfigArray = ((input: unknown): TypedFlatConfigItem[] => {
  if((input == null) || (input === false)) {
    return [];
  }

  if(Array.isArray(input)) {
    return input.flatMap(item => asConfigArray(item));
  }

  if(isConfigObject(input)) {
    return [input];
  }

  throw (new TypeError(`expected a flat config object or array, received ${typeof input}`));
});

/**
 * Applies a file scope to configs that do not already carry one. Configs with
 * their own `files` are left alone, because narrowing them further would
 * silently disable rules the plugin author scoped deliberately.
 */
const scopeTo = ((
  files: string[],
  configs: TypedFlatConfigItem[]
): TypedFlatConfigItem[] =>
  configs.map(config => (config.files
    ? config
    : {
        ...config,
        files: files
      })));

const mergeRules = ((
  ...records: Array<Partial<RuleOptions> | undefined>
): Partial<RuleOptions> => (Object.assign({}, ...records.filter(Boolean)) as Partial<RuleOptions>));

/**
 * Collects the rules from a config array, optionally limited to one plugin
 * prefix.
 */
const pickRules = ((
  configs: TypedFlatConfigItem[],
  prefix?: string
): Partial<RuleOptions> => {
  const out: Record<string, unknown> = {};

  for(const config of configs) {
    for(const [
      ruleId,
      entry
    ] of Object.entries(config.rules ?? {})) {
      if(prefix && !ruleId.startsWith(`${prefix}/`)) {
        continue;
      }
      out[ruleId] = entry;
    }
  }

  return out;
});

/**
 * Drops `plugins` from configs whose plugin is registered elsewhere. Two config
 * objects registering different instances of the same plugin name is an error
 * in flat config; this is how a module reuses a plugin's rule presets while
 * registering the plugin exactly once.
 */
const stripPlugins = ((configs: TypedFlatConfigItem[]): TypedFlatConfigItem[] => configs.map(({plugins: _plugins, ...rest}) => rest));

/** Removes rule entries whose id matches any of the given prefixes. */
const withoutRulePrefixes = ((
  rules: Partial<RuleOptions>,
  prefixes: string[]
): Partial<RuleOptions> => Object.fromEntries(Object.entries(rules).filter(([ruleId]) => !prefixes.some(p => ruleId.startsWith(`${p}/`)))));

export {
  asConfigArray,
  scopeTo,
  mergeRules,
  pickRules,
  stripPlugins,
  withoutRulePrefixes
};
