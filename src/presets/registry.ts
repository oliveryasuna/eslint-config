import type {OptionsConfig, PresetName} from '../options/types';
import {LIBRARY} from './library';
import {MINIMAL} from './minimal';
import {RECOMMENDED} from './recommended';
import {STRICT} from './strict';

const PRESETS: Record<PresetName, OptionsConfig> = {
  minimal: MINIMAL,
  recommended: RECOMMENDED,
  strict: STRICT,
  library: LIBRARY
};

const resolvePreset = ((name: (PresetName | undefined)): OptionsConfig =>
  (name
    ? PRESETS[name]
    : {}));

export {
  PRESETS,
  resolvePreset
};
