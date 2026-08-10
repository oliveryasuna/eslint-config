import process from 'node:process';

const EDITOR_ENV_VARS: string[] = [
  'VSCODE_PID',
  'VSCODE_CWD',
  'JETBRAINS_IDE',
  'VIM',
  'NVIM',
  'ZED_ENVIRONMENT',
  'NEOVIDE'
];

/**
 * Rules whose autofix is destructive while code is mid-edit: removing an import
 * you are about to use, or const-ifying a binding you are about to reassign.
 */
const EDITOR_UNFIXABLE_RULES: string[] = [
  'prefer-const',
  'test/no-only-tests',
  'unused-imports/no-unused-imports',
  'vitest/no-only-tests'
];

const isInGitHooksOrLintStaged = ((): boolean =>
  Boolean(
    process.env.GIT_PARAMS
    || process.env.VSCODE_GIT_COMMAND
    || process.env.npm_lifecycle_script?.startsWith('lint-staged')
  ));

const isInEditor = ((): boolean => {
  if(process.env.CI || isInGitHooksOrLintStaged()) {
    return false;
  }

  return EDITOR_ENV_VARS.some(name => Boolean(process.env[name]));
});

export {
  EDITOR_ENV_VARS,
  EDITOR_UNFIXABLE_RULES,
  isInGitHooksOrLintStaged,
  isInEditor
};
