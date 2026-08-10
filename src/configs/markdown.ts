import type {OptionsMarkdown} from '../options/types';
import type {ModuleContext, RuleOptions, TypedFlatConfigItem} from '../types';
import {GLOB_MARKDOWN, GLOB_MARKDOWN_CODE} from '../globs';
import {configRules, loadPlugin} from '../interop/lazy';
import {applySeverity} from '../options/severity';

const CODE_BLOCK_DISABLED: Partial<RuleOptions> = {
  'import-x/first': 'off',
  'no-alert': 'off',
  'no-console': 'off',
  'no-labels': 'off',
  'no-lone-blocks': 'off',
  'no-restricted-syntax': 'off',
  'no-undef': 'off',
  'no-unused-expressions': 'off',
  'no-unused-labels': 'off',
  'n/prefer-global/process': 'off',
  '@typescript-eslint/consistent-type-imports': 'off',
  '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-redeclare': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'unicorn/prefer-top-level-await': 'off',
  'unused-imports/no-unused-imports': 'off',
  'unused-imports/no-unused-vars': 'off'
};

const markdown = (async(
  {
    name,
    severity,
    files = [GLOB_MARKDOWN],
    codeBlocks = true,
    overrides
  }: (OptionsMarkdown & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('@eslint/markdown', 'markdown'));

  const configs: TypedFlatConfigItem[] = [
    {
      name: name('markdown', 'setup'),
      plugins: {markdown: plugin}
    },
    {
      name: name('markdown', 'processor'),
      files: files,
      // Extracts fenced blocks as virtual files while keeping the surrounding
      // prose out of the JS pipeline entirely.
      processor: 'markdown/markdown'
    },
    {
      name: name('markdown', 'rules'),
      files: files,
      language: 'markdown/gfm',
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          ...overrides
        }
      )
    }
  ];

  if(codeBlocks) {
    configs.push({
      name: name('markdown', 'overrides'),
      files: [GLOB_MARKDOWN_CODE],
      languageOptions: {parserOptions: {ecmaFeatures: {impliedStrict: true}}},
      rules: applySeverity(severity, CODE_BLOCK_DISABLED)
    });
  }

  return configs;
});

export {
  CODE_BLOCK_DISABLED,
  markdown
};
