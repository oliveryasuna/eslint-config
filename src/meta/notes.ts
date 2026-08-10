const RULE_NOTES: Record<string, string> = {
  'antfu/no-top-level-await': 'Not included. Top-level await is supported by every runtime this package targets.',
  'no-console': 'Error in app code. Relaxed by the scripts, bin and config-files overlays rather than globally.',
  'no-unused-vars': 'Delegated to unused-imports/no-unused-vars, which can autofix the import case separately from the variable case.',
  'n/prefer-global/process': 'Enforces the explicit node:process import so the same source works under bundlers that do not shim globals.',
  'perfectionist/sort-imports': 'Warn rather than error: import order is a formatting concern and should not fail a build.',
  'regexp/no-super-linear-backtracking': 'Kept at error. This is a denial-of-service class, not a style preference.',
  '@typescript-eslint/consistent-type-imports': 'Required for verbatimModuleSyntax and for correct erasure under type-stripping runtimes.',
  '@typescript-eslint/no-floating-promises': 'Type-aware. The single highest-value rule in the type-aware set; it is why typeAware exists.',
  '@typescript-eslint/no-unsafe-assignment': 'Deliberately off even in strict. Produces overwhelming noise at the boundaries of untyped dependencies.',
  'unicorn/filename-case': 'Off. File naming is a repository convention, not something a shared config should decide.',
  'unicorn/no-null': 'Off. null is meaningful in JSON, in DOM APIs, and in database rows.',
  'unicorn/prevent-abbreviations': 'Off. Renames domain vocabulary and produces churn with no correctness benefit.'
};

export {
  RULE_NOTES
};
