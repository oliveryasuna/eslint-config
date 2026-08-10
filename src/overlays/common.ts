import type {Overlay} from './types';
import {GLOB_BIN, GLOB_CJS, GLOB_CONFIG_FILES, GLOB_DTS, GLOB_SCRIPTS, GLOB_TESTS} from '../globs';

const DTS_OVERLAY: Overlay = {
  id: 'dts',
  files: [GLOB_DTS],
  rules: {
    '@eslint-community/eslint-comments/no-unlimited-disable': 'off',
    'import-x/no-duplicates': 'off',
    'no-restricted-syntax': 'off',
    'unused-imports/no-unused-vars': 'off'
  },
  why: 'Declaration files are frequently generated and legitimately contain duplicate imports, unused type-only bindings, and blanket disables.'
};

const CJS_OVERLAY: Overlay = {
  id: 'cjs',
  files: [GLOB_CJS],
  rules: {
    '@typescript-eslint/no-require-imports': 'off',
    'unicorn/prefer-module': 'off'
  },
  why: 'A .cjs file is CommonJS by definition; flagging require() there is noise.'
};

const CONFIG_FILES_OVERLAY: Overlay = {
  id: 'config-files',
  files: GLOB_CONFIG_FILES,
  rules: {
    'no-console': 'off',
    'unicorn/prefer-top-level-await': 'off'
  },
  why: 'Config files run in tooling contexts where logging is expected and top-level await may not be supported by the loader.'
};

const SCRIPTS_OVERLAY: Overlay = {
  id: 'scripts',
  files: GLOB_SCRIPTS,
  rules: {
    'no-console': 'off',
    'n/prefer-global/process': 'off'
  },
  why: 'Build and maintenance scripts communicate through the console and use process directly.'
};

const BIN_OVERLAY: Overlay = {
  id: 'bin',
  files: GLOB_BIN,
  rules: {
    'no-console': 'off',
    'n/hashbang': 'off'
  },
  why: 'Executables print to stdout and carry a hashbang line.'
};

const TEST_OVERLAY: Overlay = {
  id: 'test',
  files: GLOB_TESTS,
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-console': 'off'
  },
  why: 'Test bodies use assertions and fixtures that would be unsafe in production code but are deliberate here.'
};

const COMMON_OVERLAYS: Overlay[] = [
  DTS_OVERLAY,
  CJS_OVERLAY,
  CONFIG_FILES_OVERLAY,
  SCRIPTS_OVERLAY,
  BIN_OVERLAY,
  TEST_OVERLAY
];

const overlayToConfig = ((
  overlay: Overlay,
  name: (module: string, purpose?: 'overlay') => string
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Whatever.
) => ({
  name: name(`overlay-${overlay.id}`, 'overlay'),
  files: overlay.files,
  ...(overlay.ignores ? {ignores: overlay.ignores} : {}),
  rules: overlay.rules
}));

const applyOverlays = ((
  overlays: Overlay[],
  name: (module: string, purpose?: 'overlay') => string
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Whatever.
) => overlays.map(overlay => overlayToConfig(overlay, name)));

export {
  DTS_OVERLAY,
  CJS_OVERLAY,
  CONFIG_FILES_OVERLAY,
  SCRIPTS_OVERLAY,
  BIN_OVERLAY,
  TEST_OVERLAY,
  COMMON_OVERLAYS,
  overlayToConfig,
  applyOverlays
};
