import type {OptionsTest} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_TESTS} from '../globs';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const FRAMEWORK_PLUGINS: Record<NonNullable<OptionsTest['framework']>, string> = {
  vitest: '@vitest/eslint-plugin',
  jest: 'eslint-plugin-jest',
  node: 'eslint-plugin-jest'
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
          ...((framework === 'vitest') && configRules(plugin.configs?.recommended)),
          ...(((framework === 'jest') || (framework === 'node')) && configRules(plugin.configs?.['flat/recommended'])),

          // @ts-expect-error TS(2353): Not in vitest plugin.
          'test/no-only-tests': noOnly,

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
