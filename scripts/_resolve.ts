import type {OptionsConfig, PresetName, Severity} from '../src';
import type {Linter} from 'eslint';
import {defineConfig, FULL_ON, parseName, PRESETS} from '../src';

type ResolvedConfigs = Linter.Config[];

const resolveConfigs = (async(options: OptionsConfig): Promise<ResolvedConfigs> =>
  // `FlatConfigComposer` extends `Promise<Linter.Config[]>`, so awaiting
  // resolves it.
  (defineConfig(options))
);

/**
 * FULL_ON enables every module, so it is the only input that yields a complete
 * plugin set for typegen and a complete name set for namegen.
 */
const resolveFullOn = (async(): Promise<ResolvedConfigs> => resolveConfigs(FULL_ON));

// ==================================================
// Config names
// ==================================================

const collectConfigNames = ((configs: ResolvedConfigs): string[] => {
  const seen = (new Set<string>());
  const names: string[] = [];

  for(const config of configs) {
    if(!config.name || seen.has(config.name)) {
      continue;
    }

    seen.add(config.name);
    names.push(config.name);
  }

  return names;
});

const countUnnamedConfigs = ((configs: ResolvedConfigs): number => configs.filter(config => !config.name).length);

// ==================================================
// Rules
// ==================================================

const normalizeSeverity = ((entry: unknown): Severity => {
  const value = (Array.isArray(entry) ? entry[0] : entry);

  if((value === 2) || (value === 'error')) {
    return 'error';
  } else if((value === 1) || (value === 'warn')) {
    return 'warn';
  }

  return 'off';
});

const normalizeOptions = ((entry: unknown): unknown[] => (Array.isArray(entry)
  ? entry.slice(1)
  : []));

interface RuleRecord {
  rule: string;
  /** Severity of the LAST config that sets this rule. See caveat below. */
  severity: Severity;
  options: unknown[];
  /** Config names that set this rule, in resolution order. */
  sources: string[];
  /**
   * Module inferred from the first owning config name; 'external' for user
   * configs.
   */
  module: string;
  /**
   * True when every config setting this rule is scoped by `files` or `ignores`.
   */
  scoped: boolean;
}

/**
 * Caveat, stated here so it can be repeated verbatim in RULES.md: flat config
 * resolution is per-file and last-wins. This function reports the last entry in
 * array order, which matches the effective severity for a file matched by every
 * config that sets the rule. Where `scoped` is true, the reported severity
 * applies only to files matching those globs.
 */
const collectRules = ((configs: ResolvedConfigs): Map<string, RuleRecord> => {
  const out = (new Map<string, RuleRecord>());

  for(const config of configs) {
    if(!config.rules) {
      continue;
    }

    const isScoped = Boolean(config.files ?? config.ignores);
    const module = (parseName(config.name ?? '')?.module ?? 'external');

    for(const [
      rule,
      entry
    ] of Object.entries(config.rules)) {
      if((entry === undefined) || (entry === null)) {
        continue;
      }

      const previous = out.get(rule);
      const sources = (previous
        ? [...previous.sources]
        : []);

      if(config.name && !sources.includes(config.name)) {
        sources.push(config.name);
      }

      out.set(
        rule,
        {
          rule: rule,
          severity: normalizeSeverity(entry),
          options: normalizeOptions(entry),
          sources: sources,
          module: (previous?.module ?? module),
          scoped: (previous ? (previous.scoped && isScoped) : isScoped)
        }
      );
    }
  }

  return out;
});

// ==================================================
// Preset inventories
// ==================================================

interface PresetInventory {
  preset: PresetName;
  configs: ResolvedConfigs;
  rules: Map<string, RuleRecord>;
}

const buildInventories = (async(presets: Record<PresetName, OptionsConfig> = PRESETS): Promise<PresetInventory[]> => {
  const entries = (Object.entries(presets) as [PresetName, OptionsConfig][]);
  const inventories: PresetInventory[] = [];

  for(const [
    preset,
    options
  ] of entries) {
    const configs = (await resolveConfigs(options));
    inventories.push({
      preset: preset,
      configs: configs,
      rules: collectRules(configs)
    });
  }

  return inventories;
});

/** Stable ordering for generated output: module first, then rule ID. */
const compareRules = ((
  a: {
    module: string;
    rule: string;
  },
  b: {
    module: string;
    rule: string;
  }
): number => ((a.module.localeCompare(b.module) || a.rule.localeCompare(b.rule))));

export type {
  PresetInventory,
  ResolvedConfigs,
  RuleRecord
};
export {
  buildInventories,
  collectConfigNames,
  collectRules,
  compareRules,
  countUnnamedConfigs,
  normalizeOptions,
  normalizeSeverity,
  resolveConfigs,
  resolveFullOn
};
