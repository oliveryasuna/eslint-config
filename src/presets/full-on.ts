import type {OptionsConfig} from '../options/types';
import {COMMON_OVERLAYS} from '../overlays/common';

const FULL_ON: OptionsConfig = {
  channel: 'next',
  comments: true,
  imports: true,
  javascript: true,
  jsdoc: {stylistic: {}},
  jsonc: {},
  jsx: true,
  markdown: {codeBlocks: true},
  node: true,
  overlays: COMMON_OVERLAYS,
  perfectionist: {level: 'warn'},
  react: {
    a11y: true,
    compiler: true,
    refresh: true
  },
  regexp: true,
  stylistic: {},
  test: {framework: 'vitest'},
  toml: true,
  typescript: {
    erasableOnly: true,
    projectService: true,
    typeAware: true
  },
  unicorn: true,
  yaml: true
};

export {
  FULL_ON
};
