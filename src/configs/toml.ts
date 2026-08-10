import type {OptionsFiles, OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_TOML} from '../globs';
import {configRules, loadParser, loadPlugin} from '../interop';
import {applySeverity} from '../options';

const toml = (async(
  {
    name,
    severity,
    files = [GLOB_TOML],
    overrides
  }: (OptionsFiles & OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const [
    plugin,
    parser
  ] = (await Promise.all([
    loadPlugin('eslint-plugin-toml', 'toml'),
    loadParser('toml-eslint-parser', 'toml')
  ]));

  return [
    {
      name: name('toml', 'setup'),
      plugins: {toml: plugin}
    },
    {
      name: name('toml', 'rules'),
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
  toml
};
