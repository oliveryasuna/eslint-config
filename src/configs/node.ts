import type {OptionsOverrides} from '../options/types';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop/lazy';
import {applySeverity} from '../options/severity';

const node = (async(
  {
    name,
    severity,
    overrides
  }: (OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('eslint-plugin-n', 'node'));

  return [
    {
      name: name('node', 'rules'),
      plugins: {n: plugin},
      settings: {n: {version: '>=24.0.0'}},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.['flat/recommended']),

          // TODO: Fix this.
          'n/no-missing-import': 'off',
          // TODO: Fix this.
          'n/no-unpublished-import': 'off',

          ...overrides
        }
      )
    }
  ];
});

export {
  node
};
