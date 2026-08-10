import type {ModuleName, ProjectServiceOptions, ProjectType, StrictnessChannel} from './types';
import {GLOB_DTS, GLOB_EXCLUDE, GLOB_MARKDOWN_CODE, GLOB_TS, GLOB_TSX} from '../globs';
import {DEFAULT_NAMESPACE} from '../naming';

const DEFAULT_NAMESPACE_OPTION: string = DEFAULT_NAMESPACE;
const DEFAULT_CHANNEL: StrictnessChannel = 'stable';
const DEFAULT_PROJECT_TYPE: ProjectType = 'app';
const DEFAULT_IS_IN_EDITOR = false;

/**
 * Which modules are on when nothing is specified.
 *
 * Language-agnostic correctness modules are on. Framework modules, formatting,
 * and anything requiring a peer dependency the consumer may not have are off:
 * a module that cannot be enabled without also installing something should not
 * be enabled by a default.
 */
const MODULE_DEFAULTS: Record<ModuleName, boolean> = {
  comments: true,
  imports: true,
  javascript: true,
  jsdoc: true,
  jsonc: true,
  jsx: true,
  markdown: true,
  node: true,
  perfectionist: true,
  react: false,
  regexp: true,
  stylistic: true,
  test: true,
  toml: true,
  typescript: true,
  unicorn: true,
  yaml: true
};

const DEFAULT_TYPE_AWARE = false;
const DEFAULT_TYPE_AWARE_FILES: string[] = [
  GLOB_TS,
  GLOB_TSX
];
const DEFAULT_TYPE_AWARE_IGNORES: string[] = [
  GLOB_MARKDOWN_CODE,
  GLOB_DTS
];

// eslint-disable-next-line @stylistic/object-curly-newline -- I'll fix this later.
const DEFAULT_PROJECT_SERVICE: ProjectServiceOptions = {
  // TODO: Enabling breaks parsing on repo root files.
  // allowDefaultProject: [
  //   '*.js',
  //   '*.mjs',
  //   '*.cjs',
  //   '*.ts',
  //   '*.mts',
  //   '*.cts'
  // ]
// eslint-disable-next-line @stylistic/object-curly-newline -- I'll fix this later.
};

const DEFAULT_IGNORES: string[] = GLOB_EXCLUDE;

/** Overlays are opt-in; an empty list is the default. */
const DEFAULT_OVERLAYS: never[] = [];

export {
  DEFAULT_NAMESPACE_OPTION,
  DEFAULT_CHANNEL,
  DEFAULT_PROJECT_TYPE,
  DEFAULT_IS_IN_EDITOR,
  MODULE_DEFAULTS,
  DEFAULT_TYPE_AWARE,
  DEFAULT_TYPE_AWARE_FILES,
  DEFAULT_TYPE_AWARE_IGNORES,
  DEFAULT_PROJECT_SERVICE,
  DEFAULT_IGNORES,
  DEFAULT_OVERLAYS
};
