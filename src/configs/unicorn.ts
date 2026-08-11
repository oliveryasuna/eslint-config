import type {OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const unicorn = (async(
  {
    name,
    severity,
    overrides
  }: (OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('eslint-plugin-unicorn', 'unicorn'));

  return [
    {
      name: name('unicorn', 'rules'),
      plugins: {unicorn: plugin},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          'unicorn/catch-error-name': [
            'error',
            {name: 'err'}
          ],
          'unicorn/consistent-function-scoping': 'off',
          'unicorn/filename-case': 'off',
          'unicorn/no-array-reduce': 'off',
          'unicorn/no-await-expression-member': 'off',
          'unicorn/no-null': 'off',
          'unicorn/prefer-string-raw': 'off',
          'unicorn/prefer-string-replace-all': 'off',
          'unicorn/prevent-abbreviations': 'off',

          ...overrides
        }
      )
    }
  ];
});

export {
  unicorn
};
