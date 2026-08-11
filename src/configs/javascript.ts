import type {OptionsJavaScript} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_SRC} from '../globs';
import {configRules, loadModule, loadPlugin} from '../interop';
import {applySeverity} from '../options';

/** Syntax that is legal but reliably indicates a mistake. */
const RESTRICTED_SYNTAX: string[] = [
  'TSExportAssignment',
  'TSEnumDeclaration[const=true]',
  'LabeledStatement',
  'WithStatement'
];

interface GlobalsModule {
  es2021: Record<string, boolean>;
  node: Record<string, boolean>;
  browser: Record<string, boolean>;
}

// eslint-disable-next-line max-lines-per-function -- Expected.
const javascript = (async(
  {
    name,
    severity,
    files = [GLOB_SRC],
    overrides,
    globals: extraGlobals
  }: (OptionsJavaScript & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('@eslint/js', 'javascript'));
  const globals = (await loadModule<GlobalsModule>('globals', 'javascript'));

  return [
    {
      name: name('javascript', 'setup'),
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          ...globals.es2021,
          ...globals.node,
          ...globals.browser,
          document: 'readonly',
          navigator: 'readonly',
          window: 'readonly',
          ...extraGlobals
        },
        parserOptions: {
          ecmaFeatures: {jsx: true},
          ecmaVersion: 'latest',
          sourceType: 'module'
        },
        sourceType: 'module'
      },
      linterOptions: {reportUnusedDisableDirectives: 'error'}
    },
    {
      name: name('javascript', 'rules'),
      files: files,
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          'arrow-body-style': [
            'error',
            'as-needed'
          ],
          complexity: [
            'error',
            {maximum: 10}
          ],
          curly: [
            'error',
            'all'
          ],
          'max-lines-per-function': 'error',
          'max-statements': [
            'error',
            {max: 15}
          ],
          'no-fallthrough': 'off',
          'no-await-in-loop': 'error',
          'object-shorthand': [
            'error',
            'never'
          ],

          ...overrides
        }
      )
    }
  ];
});

export {
  RESTRICTED_SYNTAX,
  javascript
};
