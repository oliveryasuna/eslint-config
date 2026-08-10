import type {OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const comments = (async(
  {
    name,
    severity,
    overrides
  }: (OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('@eslint-community/eslint-plugin-eslint-comments', 'comments'));

  return [
    {
      name: name('comments', 'rules'),
      plugins: {'@eslint-community/eslint-comments': plugin},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          '@eslint-community/eslint-comments/require-description': 'error',

          ...overrides
        }
      )
    }
  ];
});

export {
  comments
};
