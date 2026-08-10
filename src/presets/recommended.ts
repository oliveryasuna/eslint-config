import type {OptionsConfig} from '../options/types';

const RECOMMENDED: OptionsConfig = {
  comments: true,
  imports: true,
  javascript: true,
  jsonc: {},
  markdown: true,
  node: true,
  regexp: true,
  typescript: {typeAware: false},
  unicorn: true,
  yaml: true
};

export {
  RECOMMENDED
};
