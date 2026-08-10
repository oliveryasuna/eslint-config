import type {OptionsTest} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_TESTS} from '../globs';
import {configRules, loadPlugin, renameRulePrefixes} from '../interop';
import {applySeverity} from '../options';

/**
 * Frameworks backed by a plugin. `node` is absent deliberately: the only
 * published ESLint plugin for `node:test` is a single-maintainer 0.1.x, and
 * borrowing the Jest plugin for it is worse than nothing — `jest/*` rules
 * assert Jest semantics, and `no-deprecated-functions` resolves the installed
 * Jest version at load time, so it aborts the whole run in a repository that
 * has no Jest.
 */
const FRAMEWORK_PLUGINS: Record<('jest' | 'vitest'), string> = {
  jest: 'eslint-plugin-jest',
  vitest: '@vitest/eslint-plugin'
};

/**
 * The plugin is registered as `test` so a consumer's rule ids and inline
 * disables survive a change of framework. The presets borrowed below spell
 * their ids with the plugin's own prefix, so those are rewritten to match.
 */
const TEST_PREFIXES: Record<string, string> = {
  jest: 'test',
  vitest: 'test'
};

const test = (async(
  {
    name,
    severity,
    files = GLOB_TESTS,
    framework = 'vitest',
    noOnly = 'error',
    overrides
  }: (OptionsTest & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  // `node:test` ships with the runtime and has no plugin worth depending on,
  // so this module contributes what it still can: the test file scope and the
  // overrides slot. `noOnly` has no rule to attach to and is not applied.
  if(framework === 'node') {
    return [
      {
        name: name('test', 'rules'),
        files: files,
        rules: applySeverity(severity, {...overrides})
      }
    ];
  }

  const plugin = (await loadPlugin(FRAMEWORK_PLUGINS[framework], 'test'));

  return [
    {
      name: name('test', 'setup'),
      plugins: {test: plugin}
    },
    {
      name: name('test', 'rules'),
      files: files,
      rules: applySeverity(
        severity,
        {
          ...renameRulePrefixes(
            ((framework === 'vitest')
              ? configRules(plugin.configs?.recommended)
              : configRules(plugin.configs?.['flat/recommended'])),
            TEST_PREFIXES
          ),

          // Both plugins spell this `no-focused-tests`; neither ships a rule
          // named `no-only-tests`.
          'test/no-focused-tests': noOnly,

          ...overrides
        }
      )
    }
  ];
});

export {
  FRAMEWORK_PLUGINS,
  test
};
