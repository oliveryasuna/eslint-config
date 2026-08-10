import type {GeneratedFile} from './_shared';
import {flatConfigsToRulesDTS} from 'eslint-typegen/core';
import {builtinRules} from 'eslint/use-at-your-own-risk';
import {resolveFullOn} from './_resolve';
import {banner, fromRoot, isEntrypoint, runAsScript} from './_shared';

const OUTPUT: string = fromRoot('generated/rules.d.ts');

const generate = (async(): Promise<GeneratedFile[]> => {
  const configs = (await resolveFullOn());

  const dts = (await flatConfigsToRulesDTS(
    [
      {plugins: {'': {rules: Object.fromEntries(builtinRules.entries())}}},
      ...configs
    ],
    {
      // Rule types reach consumers through `TypedFlatConfigItem`, not through a
      // global augmentation of `Linter.RulesRecord`. Augmenting would leak this
      // package's plugin set into every consumer's type space.
      includeAugmentation: false,

      // Config names are generated separately by `namegen.ts` so that adding a
      // rule and renaming a config produce independent diffs.
      augmentFlatConfigUtils: false,

      exportTypeName: 'RuleOptions',

      // The shared banner already emits the disable comments.
      includeIgnoreComments: false
    }
  ));

  return [
    {
      path: OUTPUT,
      content: `${banner('typegen.ts')}\n\n${dts}`
    }
  ];
});

if(isEntrypoint(import.meta.url)) {
  await runAsScript(generate);
}

export {
  generate,
  OUTPUT
};
