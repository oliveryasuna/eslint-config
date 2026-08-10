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
          curly: [
            'error',
            'all'
          ],
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
