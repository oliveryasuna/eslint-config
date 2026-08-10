import type {Overlay} from '../overlays';
import type {ModuleName, ModuleToggle, OptionsConfig, OptionsTypeScript, ResolvedModules, ResolvedOptions} from './types';
import {createNameFactory} from '../naming';
import {resolvePreset} from '../presets';
import {DEFAULT_CHANNEL, DEFAULT_IGNORES, DEFAULT_IS_IN_EDITOR, DEFAULT_NAMESPACE_OPTION, DEFAULT_PROJECT_TYPE, MODULE_DEFAULTS} from './defaults';
import {createSeverityResolver} from './severity';

/**
 * A global `files` is meaningless in flat config — scope belongs to individual
 * config objects — and accepting one would invite configs that silently do
 * nothing. Rejected loudly rather than ignored.
 */
const assertNoFiles = ((options: OptionsConfig): void => {
  if('files' in options) {
    throw (new TypeError(
      'top-level `files` is not supported: file scope belongs to individual configs.\n'
      + 'Pass a config object as an additional argument instead:\n'
      + '  defineConfig({ … }, { files: [\'src/**\'], rules: { … } })'
    ));
  }
});

/**
 * `projectService` and `project` are two different discovery strategies.
 * Silently preferring one would make the other look broken.
 */
const assertExclusive = ((options: OptionsTypeScript): void => {
  if((options.projectService !== undefined) && (options.project !== undefined)) {
    throw (new TypeError(
      '`typescript.projectService` and `typescript.project` are mutually exclusive.\n'
      + 'Use `projectService` unless your repository is one it cannot handle.'
    ));
  }
});

const collapse = (<T extends object>(
  toggle: (ModuleToggle<T> | undefined),
  fallback: boolean
): (false | T) => {
  const value = (toggle ?? fallback);
  if(value === false) {
    return false;
  }
  if(value === true) {
    return ({} as T);
  }

  return value;
});

const isEnabled = ((
  options: OptionsConfig,
  key: ModuleName
): boolean => (collapse(options[key], MODULE_DEFAULTS[key]) !== false));

/**
 * Merges the preset beneath the user's options. Module options are merged one
 * level deep so `{ typescript: { typeAware: true } }` does not discard the
 * preset's `filesTypeAware`.
 */
const mergeOptions = ((
  base: OptionsConfig,
  user: OptionsConfig
): OptionsConfig => {
  const merged: Record<string, unknown> = {...base};

  for(const [
    key,
    value
  ] of Object.entries(user)) {
    const existing = merged[key];
    const bothObjects =
      ((typeof value === 'object') && (value !== null) && !Array.isArray(value)
        && (typeof existing === 'object') && (existing !== null) && !Array.isArray(existing));

    merged[key] = (bothObjects
      ? {
          ...existing,
          ...value
        }
      : value);
  }

  return merged;
});

const resolveIgnores = ((options: OptionsConfig): string[] => {
  const {ignores} = options;
  if(ignores === undefined) {
    return [...DEFAULT_IGNORES];
  }

  return ((typeof ignores === 'function')
    ? ignores([...DEFAULT_IGNORES])
    : [...ignores]);
});

const resolveOverlays = ((options: OptionsConfig): Overlay[] => {
  const {overlays} = options;

  return (((overlays === false) || (overlays === undefined))
    ? []
    : [...overlays]);
});

const resolveModules = ((options: OptionsConfig): ResolvedModules => {
  const typescript = collapse(options.typescript, MODULE_DEFAULTS.typescript);
  if(typescript !== false) {
    assertExclusive(typescript);
  }

  const modules: ResolvedModules = {
    comments: collapse(options.comments, MODULE_DEFAULTS.comments),
    imports: collapse(options.imports, MODULE_DEFAULTS.imports),
    javascript: collapse(options.javascript, MODULE_DEFAULTS.javascript),
    jsdoc: collapse(options.jsdoc, MODULE_DEFAULTS.jsdoc),
    jsonc: collapse(options.jsonc, MODULE_DEFAULTS.jsonc),
    jsx: collapse(options.jsx, MODULE_DEFAULTS.jsx),
    markdown: collapse(options.markdown, MODULE_DEFAULTS.markdown),
    node: collapse(options.node, MODULE_DEFAULTS.node),
    perfectionist: collapse(options.perfectionist, MODULE_DEFAULTS.perfectionist),
    react: collapse(options.react, MODULE_DEFAULTS.react),
    regexp: collapse(options.regexp, MODULE_DEFAULTS.regexp),
    stylistic: collapse(options.stylistic, MODULE_DEFAULTS.stylistic),
    test: collapse(options.test, MODULE_DEFAULTS.test),
    toml: collapse(options.toml, MODULE_DEFAULTS.toml),
    typescript: typescript,
    unicorn: collapse(options.unicorn, MODULE_DEFAULTS.unicorn),
    yaml: collapse(options.yaml, MODULE_DEFAULTS.yaml)
  };

  // Top-level `overrides` is sugar for per-module `overrides`; fold it in so
  // config modules only ever read one location.
  for(const [
    key,
    overrides
  ] of Object.entries(options.overrides ?? {})) {
    const module = modules[key as ModuleName];
    if((module === false) || !overrides) {
      continue;
    }

    Object.assign(
      module,
      {
        overrides: {
          ...(module as {overrides?: object;}).overrides,
          ...overrides
        }
      }
    );
  }

  return modules;
});

const resolveOptions = ((options: OptionsConfig = {}): ResolvedOptions => {
  assertNoFiles(options);

  const merged = (options.preset
    ? mergeOptions(resolvePreset(options.preset), options)
    : options);

  const namespace = (merged.namespace ?? DEFAULT_NAMESPACE_OPTION);
  const channel = (merged.channel ?? DEFAULT_CHANNEL);

  return {
    namespace: namespace,
    name: createNameFactory(namespace),
    severity: createSeverityResolver(channel),
    type: (merged.type ?? DEFAULT_PROJECT_TYPE),
    channel: channel,
    isInEditor: (merged.isInEditor ?? DEFAULT_IS_IN_EDITOR),
    ignores: resolveIgnores(merged),
    overlays: resolveOverlays(merged),
    modules: resolveModules(merged)
  };
});

export {
  assertNoFiles,
  assertExclusive,
  isEnabled,
  mergeOptions,
  resolveIgnores,
  resolveOptions
};
