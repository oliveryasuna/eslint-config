import type {ModuleContext, TypedFlatConfigItem} from '../types';

const ignores = (async(
  options: ({ignores: string[];} & ModuleContext)
): Promise<TypedFlatConfigItem[]> => [
  {
    name: options.name('ignores'),
    ignores: options.ignores
  }
]);

export {
  ignores
};
