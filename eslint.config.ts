import {CONFIG_FILES_OVERLAY, defineConfig, DTS_OVERLAY, SCRIPTS_OVERLAY, TEST_OVERLAY} from './src';

export default defineConfig(
  {
    type: 'lib',
    channel: 'next',
    ignores: (defaults => [
      ...defaults,
      '*git-ignore*',
      '.tsbuild',
      'generated',
      'RULES.md'
    ]),
    overlays: [
      DTS_OVERLAY,
      CONFIG_FILES_OVERLAY,
      SCRIPTS_OVERLAY,
      TEST_OVERLAY
    ],
    javascript: {globals: {Bun: 'readonly'}},
    perfectionist: {level: 'warn'},
    stylistic: true,
    test: {framework: 'vitest'},
    typescript: {
      typeAware: true,
      projectService: true,
      // Anchored to this file's directory, not process.cwd(), so linting
      // behaves the same from the repo root and from an editor.
      tsconfigRootDir: import.meta.dirname
    }
  },
  {
    name: 'local/generators',
    files: ['scripts/**/*.ts'],
    rules: {
      // The generators report progress on stderr by design.
      'no-console': 'off'
    }
  },
  {
    name: 'local/rule-tables',
    files: [
      'src/configs/**/*.ts',
      'src/overlays/**/*.ts',
      'src/meta/**/*.ts'
    ],
    rules: {
      // Rule records and rationale strings are data tables. Sorting them by
      // anything other than rule id would make the RULES.md diff unreadable,
      // and the strings are long by nature.
      'perfectionist/sort-objects': 'off',
      'style/max-len': 'off'
    }
  }
);
