import type {OptionsTypeScript} from '../options';
import type {ModuleContext, RuleOptions, TypedFlatConfigItem} from '../types';
import {GLOB_SRC, GLOB_TS, GLOB_TSX} from '../globs';
import {asConfigArray, loadParser, loadPlugin, mergeRules, pickRules} from '../interop';
import {applySeverity, DEFAULT_PROJECT_SERVICE, DEFAULT_TYPE_AWARE_FILES, DEFAULT_TYPE_AWARE_IGNORES} from '../options';
import {CUSTOM_PLUGIN} from '../rules';

/** Core rules replaced by a TypeScript-aware equivalent. */
const EXTENSION_RULES: Partial<RuleOptions> = {
  'dot-notation': 'off',
  'no-dupe-class-members': 'off',
  'no-implied-eval': 'off',
  'no-redeclare': 'off',
  'no-throw-literal': 'off',
  'no-useless-constructor': 'off',
  '@typescript-eslint/dot-notation': [
    'error',
    {allowKeywords: true}
  ],
  '@typescript-eslint/no-dupe-class-members': 'error',
  '@typescript-eslint/no-redeclare': [
    'error',
    {builtinGlobals: false}
  ],
  '@typescript-eslint/no-useless-constructor': 'error'
};

/** Rules requiring type information. Only emitted when `typeAware` is true. */
const TYPE_AWARE_RULES: Partial<RuleOptions> = {
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-floating-promises': [
    'error',
    {ignoreVoid: true}
  ],
  '@typescript-eslint/no-for-in-array': 'error',
  '@typescript-eslint/no-implied-eval': 'error',
  '@typescript-eslint/no-misused-promises': [
    'error',
    {checksVoidReturn: false}
  ],
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/promise-function-async': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/return-await': [
    'error',
    'in-try-catch'
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/unbound-method': 'error'
};

/** Syntax that cannot be erased by a type-stripping runtime. */
const ERASABLE_RULES: Partial<RuleOptions> = {
  '@typescript-eslint/no-namespace': 'error',
  '@typescript-eslint/parameter-properties': 'error',
  '@typescript-eslint/prefer-literal-enum-member': 'error'
};

// eslint-disable-next-line max-lines-per-function -- Expected.
const typescript = (async(
  {
    name,
    severity,
    files = [GLOB_SRC],
    typeAware = false,
    projectService,
    project,
    tsconfigRootDir,
    filesTypeAware = DEFAULT_TYPE_AWARE_FILES,
    ignoresTypeAware = DEFAULT_TYPE_AWARE_IGNORES,
    overrides,
    overridesTypeAware,
    erasableOnly = false,
    parserOptions
  }: (OptionsTypeScript & ModuleContext)
// eslint-disable-next-line complexity -- Expected.
): Promise<TypedFlatConfigItem[]> => {
  const [plugin, parser] = (await Promise.all([
    loadPlugin('@typescript-eslint/eslint-plugin', 'typescript'),
    loadParser('@typescript-eslint/parser', 'typescript')
  ]));

  // Discovery: projectService by default when type-aware, unless the consumer
  // explicitly chose the legacy `project` strategy.
  const discovery = ((project === undefined)
    ? (typeAware
        ? {
            projectService: (((projectService === undefined) || (projectService === true))
              ? DEFAULT_PROJECT_SERVICE
              : projectService),
            ...(tsconfigRootDir ? {tsconfigRootDir: tsconfigRootDir} : {})
          }
        : {})
    : {
        project: project,
        ...(tsconfigRootDir ? {tsconfigRootDir: tsconfigRootDir} : {})
      });

  const pluginConfigs = (plugin as {configs?: Record<string, unknown>;}).configs;

  // `strict` is a superset of `recommended` today, so layering them is a no-op
  // in rule terms. Both are named anyway: it states the intent, and a rule the
  // plugin ever demotes out of `strict` still arrives.
  const baseRules = mergeRules(
    pickRules(asConfigArray(pluginConfigs?.recommended)),
    pickRules(asConfigArray(pluginConfigs?.strict))
  );

  const configs: TypedFlatConfigItem[] = [
    {
      name: name('typescript', 'setup'),
      // Registered under the plugin's own name rather than a short alias: the
      // rule ids borrowed from its presets below are spelled that way, and a
      // rename would invalidate every `eslint-disable @typescript-eslint/…`
      // comment a consumer already has. `SHORT_PREFIXES` remains available for
      // consumers who want the alias in their own repository.
      plugins: {'@typescript-eslint': plugin}
    },
    {
      name: name('typescript', 'parser'),
      files: (typeAware
        ? files
        : [...files]),
      languageOptions: {
        parser: parser,
        parserOptions: {
          extraFileExtensions: [],
          sourceType: 'module',
          ...discovery,
          ...parserOptions
        }
      }
    },
    {
      name: name('typescript', 'rules'),
      files: [
        GLOB_TS,
        GLOB_TSX
      ],
      plugins: {custom: CUSTOM_PLUGIN},
      rules: applySeverity(
        severity,
        {
          ...baseRules,
          ...EXTENSION_RULES,

          'custom/two-spaces-before-inline-comment': ['error'],
          'custom/comment-length-limit': ['error'],
          'custom/insane-parentheses': ['error'],
          'custom/one-parameter-per-line': ['error'],
          'custom/multiline-arguments': ['error'],

          '@typescript-eslint/ban-ts-comment': [
            'error',
            {'ts-expect-error': 'allow-with-description'}
          ],
          '@typescript-eslint/consistent-type-definitions': [
            'error',
            'interface'
          ],
          '@typescript-eslint/consistent-type-imports': [
            'error',
            {
              disallowTypeAnnotations: false,
              fixStyle: 'separate-type-imports',
              prefer: 'type-imports'
            }
          ],
          '@typescript-eslint/explicit-function-return-type': 'error',
          '@typescript-eslint/explicit-member-accessibility': 'error',
          '@typescript-eslint/init-declarations': 'error',
          '@typescript-eslint/member-ordering': 'error',
          '@typescript-eslint/method-signature-style': [
            'error',
            'method'
          ],
          '@typescript-eslint/no-confusing-void-expression': 'error',
          '@typescript-eslint/no-empty-object-type': [
            'error',
            {allowInterfaces: 'always'}
          ],
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-import-type-side-effects': 'error',
          '@typescript-eslint/no-loop-func': 'error',
          '@typescript-eslint/no-non-null-assertion': 'error',
          '@typescript-eslint/no-require-imports': 'error',
          '@typescript-eslint/no-unnecessary-condition': 'error',
          '@typescript-eslint/no-unsafe-member-access': 'error',
          '@typescript-eslint/no-unsafe-type-assertion': 'error',
          '@typescript-eslint/no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
              destructuredArrayIgnorePattern: '^_'
            }
          ],
          '@typescript-eslint/no-use-before-define': 'error',
          '@typescript-eslint/no-wrapper-object-types': 'error',

          ...overrides
        }
      )
    }
  ];

  if(erasableOnly) {
    configs.push({
      name: name('typescript', 'rules'),
      files: [
        GLOB_TS,
        GLOB_TSX
      ],
      rules: applySeverity(severity, ERASABLE_RULES)
    });
  }

  if(typeAware) {
    configs.push({
      name: name('typescript', 'type-aware'),
      files: filesTypeAware,
      ignores: ignoresTypeAware,
      rules: applySeverity(
        severity,
        {
          ...TYPE_AWARE_RULES,
          ...overridesTypeAware
        }
      )
    });
  }

  return configs;
});

export {
  EXTENSION_RULES,
  TYPE_AWARE_RULES,
  ERASABLE_RULES,
  typescript
};
