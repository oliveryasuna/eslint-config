import type {OptionsReact} from '../options/types';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_JSX, GLOB_SRC, GLOB_TSX} from '../globs';
import {configRules, loadPlugin} from '../interop/lazy';
import {applySeverity} from '../options/severity';

const REFRESH_ALLOW_CONSTANT_EXPORT = true;

// eslint-disable-next-line max-lines-per-function -- Expected.
const react = (async(
  {
    name,
    severity,
    files = [GLOB_SRC],
    compiler = false,
    refresh = false,
    a11y = false,
    overrides
  }: (OptionsReact & ModuleContext)
// eslint-disable-next-line complexity -- Expected.
): Promise<TypedFlatConfigItem[]> => {
  const [
    reactPlugin,
    hooks
  ] = (await Promise.all([
    loadPlugin('@eslint-react/eslint-plugin', 'react'),
    loadPlugin('eslint-plugin-react-hooks', 'react')
  ]));

  const refreshPlugin = (refresh
    ? (await loadPlugin('eslint-plugin-react-refresh', 'react'))
    : null);
  const a11yPlugin = (a11y
    ? (await loadPlugin('eslint-plugin-jsx-a11y', 'react'))
    : null);
  const compilerPlugin = (compiler
    ? (await loadPlugin('eslint-plugin-react-compiler', 'react'))
    : null);

  const allowConstantExport = ((typeof refresh === 'object')
    ? (refresh.allowConstantExport ?? REFRESH_ALLOW_CONSTANT_EXPORT)
    : REFRESH_ALLOW_CONSTANT_EXPORT);

  return [
    {
      name: name('react', 'setup'),
      plugins: {
        '@eslint-react': reactPlugin,
        'react-hooks': hooks,
        ...(refreshPlugin && {'react-refresh': refreshPlugin}),
        ...(a11yPlugin && {'jsx-a11y': a11yPlugin}),
        ...(compilerPlugin && {'react-compiler': compilerPlugin})
      },
      languageOptions: {parserOptions: {ecmaFeatures: {jsx: true}}}
    },
    {
      name: name('react', 'rules'),
      files: files,
      rules: applySeverity(
        severity,
        {
          ...configRules(reactPlugin.configs?.recommended),
          ...configRules(reactPlugin.configs?.['recommended-typescript']),
          ...configRules(reactPlugin.configs?.['recommended-type-checked']),
          ...configRules(hooks.configs?.recommended),

          ...(refreshPlugin && {
            'react-refresh/only-export-components': [
              'warn',
              {allowConstantExport: allowConstantExport}
            ]
          }),
          ...(compilerPlugin && {'react-compiler/react-compiler': 'error'}),

          ...overrides
        }
      )
    },
    ...(a11yPlugin
      ? [
          {
            name: name('react', 'overrides'),
            files: [
              GLOB_JSX,
              GLOB_TSX
            ],
            rules: applySeverity(
              severity,
              {...configRules(a11yPlugin.flatConfigs?.recommended)}
            )
          } satisfies TypedFlatConfigItem
        ]
      : [])
  ];
});

export {
  REFRESH_ALLOW_CONSTANT_EXPORT,
  react
};
