import type {OptionsImports} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const imports = (async(
  {
    name,
    severity,
    files,
    overrides,
    restricted = []
  }: (OptionsImports & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const [
    importPlugin,
    unusedImports
  ] = (await Promise.all([
    loadPlugin('eslint-plugin-import-x', 'imports'),
    loadPlugin('eslint-plugin-unused-imports', 'imports')
  ]));

  return [
    {
      name: name('imports', 'setup'),
      plugins: {
        'import-x': importPlugin,
        'unused-imports': unusedImports
      }
    },
    {
      name: name('imports', 'rules'),
      ...(files ? {files: files} : {}),
      settings: {'import-x/resolver': {typescript: true}},
      rules: applySeverity(
        severity,
        {
          ...configRules(importPlugin.configs?.['flat/recommended']),
          ...configRules(importPlugin.configs?.['flat/typescript']),

          'import-x/exports-last': 'error',

          'unused-imports/no-unused-imports': 'error',
          'unused-imports/no-unused-vars': [
            'error',
            {
              args: 'after-used',
              argsIgnorePattern: '^_',
              caughtErrors: 'all',
              caughtErrorsIgnorePattern: '^_',
              destructuredArrayIgnorePattern: '^_',
              ignoreRestSiblings: true,
              vars: 'all',
              varsIgnorePattern: '^_'
            }
          ],

          ...((restricted.length > 0)
            ? {
                'no-restricted-imports': [
                  'error',
                  {paths: restricted}
                ]
              }
            : {}),

          ...overrides
        }
      )
    }
  ];
});

export {
  imports
};
