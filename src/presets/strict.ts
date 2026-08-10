import type {OptionsConfig} from '../options/types';
import {RECOMMENDED} from './recommended';

const STRICT: OptionsConfig = {
  ...RECOMMENDED,
  jsdoc: true,
  perfectionist: {level: 'warn'},
  typescript: {
    projectService: true,
    typeAware: true
  }
};

export {
  STRICT
};
