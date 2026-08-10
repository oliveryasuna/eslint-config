/**
 * Glob constants. No imports, no logic beyond two combinators.
 *
 * Extension patterns use the `?([cm])` optional-group form so that `.mts`,
 * `.cts`, `.mjs` and `.cjs` are covered without enumerating every combination.
 * ESLint's matcher (minimatch) supports extglob, so this is safe.
 */

//==================================================
// Source
//==================================================

const GLOB_SRC_EXT = '?([cm])[jt]s?(x)';
const GLOB_SRC = '**/*.?([cm])[jt]s?(x)';

const GLOB_JS = '**/*.?([cm])js';
const GLOB_JSX = '**/*.?([cm])jsx';
const GLOB_TS = '**/*.?([cm])ts';
const GLOB_TSX = '**/*.?([cm])tsx';

const GLOB_DTS = '**/*.d.?([cm])ts';
const GLOB_CJS = '**/*.cjs';
const GLOB_MJS = '**/*.mjs';

//==================================================
// Data and markup
//==================================================

const GLOB_JSON = '**/*.json';
const GLOB_JSON5 = '**/*.json5';
const GLOB_JSONC = '**/*.jsonc';
const GLOB_YAML = '**/*.y?(a)ml';
const GLOB_TOML = '**/*.toml';
const GLOB_XML = '**/*.xml';
const GLOB_SVG = '**/*.svg';
const GLOB_HTML = '**/*.htm?(l)';
const GLOB_CSS = '**/*.css';
const GLOB_POSTCSS = '**/*.{p,post}css';
const GLOB_LESS = '**/*.less';
const GLOB_SCSS = '**/*.scss';
const GLOB_STYLE = '**/*.{c,le,sc}ss';

const GLOB_MARKDOWN = '**/*.md';
/** Fenced code blocks inside markdown, as exposed by the markdown processor. */
const GLOB_MARKDOWN_CODE = `${GLOB_MARKDOWN}/${GLOB_SRC}`;
const GLOB_MARKDOWN_IN_MARKDOWN = '**/*.md/*.md';

//==================================================
// Roles
//==================================================

const GLOB_TESTS: string[] = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`
];

const GLOB_CONFIG_FILES: string[] = [
  '**/*.config.?([cm])[jt]s',
  '**/*.config.*.?([cm])[jt]s'
];

const GLOB_SCRIPTS: string[] = [`**/scripts/**/*.${GLOB_SRC_EXT}`];

const GLOB_BIN: string[] = [
  '**/bin/**/*.?([cm])[jt]s',
  '**/bin.?([cm])[jt]s'
];

//==================================================
// Aggregates
//==================================================

const GLOB_ALL_SRC: string[] = [
  GLOB_SRC,
  GLOB_STYLE,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_MARKDOWN,
  GLOB_YAML,
  GLOB_TOML,
  GLOB_HTML
];

const GLOB_EXCLUDE: string[] = [
  '**/node_modules',
  '**/dist',
  '**/output',
  '**/coverage',
  '**/temp',
  '**/.temp',
  '**/tmp',
  '**/.tmp',
  '**/.history',
  '**/.vitepress/cache',
  '**/.nuxt',
  '**/.next',
  '**/.svelte-kit',
  '**/.vercel',
  '**/.changeset',
  '**/.idea',
  '**/.cache',
  '**/.output',
  '**/.vite-inspect',
  '**/.yarn',
  '**/vite.config.*.timestamp-*',

  '**/CHANGELOG*.md',
  '**/*.min.*',
  '**/LICENSE*',
  '**/__snapshots__',
  '**/auto-import?(s).d.ts',
  '**/components.d.ts',

  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lock',
  '**/bun.lockb',
  '**/deno.lock'
];

//==================================================
// Combinators
//==================================================

/**
 * `withExtensions('**\/*', ['ts', 'tsx'])` -> `['**\/*.ts', '**\/*.tsx']`
 */
const withExtensions = ((
  base: string,
  extensions: string[]
): string[] =>
  extensions.map(extension => `${base}.${extension.replace(/^\./, '')}`));

/**
 * `underDir('packages/core', GLOB_SRC)` ->
 * `'packages/core/**\/*.?([cm])[jt]s?(x)'`
 *
 * Strips a leading `**\/` from the glob so the result stays anchored to `dir`.
 */
const underDir = ((
  dir: string,
  glob: string
): string => {
  const trimmedDir = dir.replace(/\/+$/, '');
  const trimmedGlob = glob.replace(/^\*\*\//, '');
  return `${trimmedDir}/**/${trimmedGlob}`;
});

export {
  GLOB_SRC_EXT,
  GLOB_SRC,
  GLOB_JS,
  GLOB_JSX,
  GLOB_TS,
  GLOB_TSX,
  GLOB_DTS,
  GLOB_CJS,
  GLOB_MJS,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_JSONC,
  GLOB_YAML,
  GLOB_TOML,
  GLOB_XML,
  GLOB_SVG,
  GLOB_HTML,
  GLOB_CSS,
  GLOB_POSTCSS,
  GLOB_LESS,
  GLOB_SCSS,
  GLOB_STYLE,
  GLOB_MARKDOWN,
  GLOB_MARKDOWN_CODE,
  GLOB_MARKDOWN_IN_MARKDOWN,
  GLOB_TESTS,
  GLOB_CONFIG_FILES,
  GLOB_SCRIPTS,
  GLOB_BIN,
  GLOB_ALL_SRC,
  GLOB_EXCLUDE,
  withExtensions,
  underDir
};
