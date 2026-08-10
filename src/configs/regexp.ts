import type {OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const regexp = (async(
  {
    name,
    severity,
    overrides
  }: (OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('eslint-plugin-regexp', 'regexp'));

  return [
    {
      name: name('regexp', 'rules'),
      plugins: {regexp: plugin},
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          ...overrides
        }
      )
    }
  ];
});

export {
  regexp
};
