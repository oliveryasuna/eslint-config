import type {Generator} from './_shared';
import {generate as namegen} from './namegen';
import {generate as rulegen} from './rulegen';
import {generate as typegen} from './typegen';

const GENERATORS: Record<string, Generator> = {
  typegen: typegen,
  namegen: namegen,
  rulegen: rulegen
};

export {
  GENERATORS
};
