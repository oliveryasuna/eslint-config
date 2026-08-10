import type {OptionsJsonc} from '../options/types';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_JSON, GLOB_JSON5, GLOB_JSONC} from '../globs';
import {configRules, loadParser, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const jsonc = (async(
  {
    name,
    severity,
    files = [
      GLOB_JSON,
      GLOB_JSON5,
      GLOB_JSONC
    ],
    overrides
  }: (OptionsJsonc & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const [
    plugin,
    parser
  ] = (await Promise.all([
    loadPlugin('eslint-plugin-jsonc', 'jsonc'),
    loadParser('jsonc-eslint-parser', 'jsonc')
  ]));

  const configs: TypedFlatConfigItem[] = [
    {
      name: name('jsonc', 'setup'),
      plugins: {jsonc: plugin}
    },
    {
      name: name('jsonc', 'rules'),
      files: files,
      languageOptions: {parser: parser},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.['flat/recommended-with-json']),
          ...configRules(plugin.configs?.['flat/recommended-with-jsonc']),
          ...configRules(plugin.configs?.['flat/recommended-with-jsonc5']),

          // TODO: Fix this.
          'jsonc/no-comments': 'off',

          ...overrides
        }
      )
    }
  ];

  return configs;
});

export {
  jsonc
};
