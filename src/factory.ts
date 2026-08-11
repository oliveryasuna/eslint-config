import type {ConfigNames} from '../generated/config-names';
import type {OptionsConfig, ResolvedOptions} from './options';
import type {ModuleContext, ResolvableFlatConfig, TypedFlatConfigItem} from './types';
import {composer, type FlatConfigComposer} from 'eslint-flat-config-utils';
import * as configs from './configs';
import {EDITOR_UNFIXABLE_RULES} from './detect';
import {GLOB_MARKDOWN} from './globs';
import {resolveOptions} from './options';
import {applyOverlays} from './overlays';

/**
 * Lazy so the builtin rule table is only loaded when fixes are being disabled.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Whatever.
const BUILTIN_RULES_LOADER = (async() => (await import('eslint/use-at-your-own-risk')).builtinRules);

/**
 * Returns the unresolved module outputs in config order. Exported because the
 * generators and snapshot tests want the array before composition.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- Expected.
const assembleConfigs = ((
  resolved: ResolvedOptions
// eslint-disable-next-line complexity -- Expected.
): Array<Promise<TypedFlatConfigItem[]>> => {
  const {modules, name, severity, ignores, overlays, type} = resolved;
  const ctx: ModuleContext = {
    name: name,
    severity: severity
  };

  const pending: Array<Promise<TypedFlatConfigItem[]>> = [
    configs.ignores({
      ...ctx,
      ignores: ignores
    })
  ];

  if(modules.javascript) {
    pending.push(configs.javascript({
      ...ctx,
      ...modules.javascript
    }));
  }
  if(modules.comments) {
    pending.push(configs.comments({
      ...ctx,
      ...modules.comments
    }));
  }
  if(modules.node) {
    pending.push(configs.node({
      ...ctx,
      ...modules.node
    }));
  }
  if(modules.imports) {
    pending.push(configs.imports({
      ...ctx,
      ...modules.imports
    }));
  }
  if(modules.unicorn) {
    pending.push(configs.unicorn({
      ...ctx,
      ...modules.unicorn
    }));
  }
  if(modules.regexp) {
    pending.push(configs.regexp({
      ...ctx,
      ...modules.regexp
    }));
  }
  if(modules.jsdoc) {
    pending.push(configs.jsdoc({
      ...ctx,
      ...modules.jsdoc
    }));
  }
  if(modules.jsx) {
    pending.push(configs.jsx({
      ...ctx,
      ...modules.jsx
    }));
  }
  if(modules.typescript) {
    pending.push(configs.typescript({
      ...ctx,
      ...modules.typescript
    }));
  }
  if(modules.react) {
    pending.push(configs.react({
      ...ctx,
      ...modules.react
    }));
  }
  if(modules.test) {
    pending.push(configs.test({
      ...ctx,
      ...modules.test
    }));
  }
  if(modules.perfectionist) {
    pending.push(configs.perfectionist({
      ...ctx,
      ...modules.perfectionist
    }));
  }
  if(modules.stylistic) {
    pending.push(configs.stylistic({
      ...ctx,
      ...modules.stylistic
    }));
  }
  if(modules.jsonc) {
    pending.push(configs.jsonc({
      ...ctx,
      ...modules.jsonc
    }));
  }
  if(modules.yaml) {
    pending.push(configs.yaml({
      ...ctx,
      ...modules.yaml
    }));
  }
  if(modules.toml) {
    pending.push(configs.toml({
      ...ctx,
      ...modules.toml
    }));
  }
  if(modules.markdown) {
    pending.push(configs.markdown({
      ...ctx,
      ...modules.markdown
    }));
  }

  // Overlays land last so their relaxations win over the module that set the
  // rule, which is the entire point of an overlay.
  if(overlays.length > 0) {
    pending.push(Promise.resolve(applyOverlays(overlays, name)));
  }

  // `type` currently only affects rules the library preset sets through
  // overrides; referenced here so the field is not silently unused.
  void type;

  return pending;
});

const defineConfig = (async(
  options: OptionsConfig = {},
  ...userConfigs: ResolvableFlatConfig[]
): Promise<FlatConfigComposer<TypedFlatConfigItem, ConfigNames>> => {
  const resolved = resolveOptions(options);

  let pipeline = composer<TypedFlatConfigItem, ConfigNames>(
    ...assembleConfigs(resolved),
    ...userConfigs
  );

  if(resolved.modules.markdown) {
    pipeline = pipeline.setDefaultIgnores(previous => [
      ...previous,
      GLOB_MARKDOWN
    ]);
  }

  if(resolved.isInEditor) {
    pipeline = pipeline.disableRulesFix(
      EDITOR_UNFIXABLE_RULES,
      {builtinRules: BUILTIN_RULES_LOADER}
    );
  }

  return pipeline;
});

export {
  BUILTIN_RULES_LOADER,
  assembleConfigs,
  defineConfig
};

export type {
  FlatConfigComposer
} from 'eslint-flat-config-utils';
