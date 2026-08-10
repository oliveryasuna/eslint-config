import type {OptionsFiles, OptionsOverrides} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {GLOB_JSX, GLOB_TSX} from '../globs';
import {applySeverity} from '../options';

const jsx = (async(
  {
    name,
    severity,
    files = [
      GLOB_JSX,
      GLOB_TSX
    ],
    overrides
  }: (OptionsFiles & OptionsOverrides & ModuleContext)
): Promise<TypedFlatConfigItem[]> => [
  {
    name: name('jsx', 'setup'),
    files: files,
    languageOptions: {parserOptions: {ecmaFeatures: {jsx: true}}},
    ...(overrides ? {rules: applySeverity(severity, overrides)} : {})
  }
]);

export {
  jsx
};
