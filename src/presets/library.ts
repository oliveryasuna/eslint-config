import type {OptionsConfig} from '../options/types';
import {STRICT} from './strict';

const LIBRARY: OptionsConfig = {
  ...STRICT,
  type: 'lib',
  overrides: {
    javascript: {'no-console': 'error'},
    typescript: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
          allowIIFEs: true
        }
      ]
    }
  }
};

export {
  LIBRARY
};
