import type {OptionsOverrides, OptionsStylistic} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const jsdoc = (async(
  {
    name,
    severity,
    overrides,
    stylistic = false
  }: (OptionsOverrides & OptionsStylistic & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('eslint-plugin-jsdoc', 'jsdoc'));

  return [
    {
      name: name('jsdoc', 'rules'),
      plugins: {jsdoc: plugin},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.['flat/recommended']),
          ...configRules(plugin.configs?.['flat/recommended-typescript']),
          ...configRules(plugin.configs?.['flat/recommended-tsdoc']),
          ...(stylistic && configRules(plugin.configs?.['flat/stylistic-typescript'])),

          'jsdoc/require-param': 'off',
          'jsdoc/require-returns': 'off',

          ...overrides
        }
      )
    }
  ];
});

export {
  jsdoc
};
