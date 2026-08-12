import type {OptionsFiles, OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_YAML} from '../globs';
import {configRules, loadParser, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const yaml = (async(
  {
    name,
    severity,
    files = [GLOB_YAML],
    overrides
  }: (OptionsFiles & OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const [
    plugin,
    parser
  ] = (await Promise.all([
    loadPlugin('eslint-plugin-yml', 'yaml'),
    loadParser('yaml-eslint-parser', 'yaml')
  ]));

  return [
    {
      name: name('yaml', 'setup'),
      plugins: {yml: plugin}
    },
    {
      name: name('yaml', 'rules'),
      files: files,
      languageOptions: {parser: parser},
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
  yaml
};
