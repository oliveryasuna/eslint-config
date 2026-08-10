import {collectConfigNames, countUnnamedConfigs, resolveFullOn} from './_resolve';
import {banner, fromRoot, type GeneratedFile, isEntrypoint, runAsScript} from './_shared';

const OUTPUT: string = fromRoot('generated/config-names.d.ts');

const assertQuotable = ((names: string[]): void => {
  const bad = names.filter(name => /['\\\n]/.test(name));

  if(bad.length > 0) {
    throw (new Error(`Config names must not contain quotes, backslashes or newlines: ${bad.join(', ')}`));
  }
});

const generate = (async(): Promise<GeneratedFile[]> => {
  const configs = (await resolveFullOn());
  const names = collectConfigNames(configs);
  const unnamed = countUnnamedConfigs(configs);

  if(names.length === 0) {
    throw (new Error('namegen: FULL_ON resolved to zero named configs'));
  }

  assertQuotable(names);

  const content = [
    banner('namegen.ts'),
    '',
    '/**',
    ' * Every config name emitted by the FULL_ON preset, in resolution order.',
    ' *',
    ' * PUBLIC API. `.override(name, …)`, `.replace(name, …)` and `.remove(name)`',
    ' * target these strings, so removing or renaming an entry is a breaking',
    ' * change. Enforced by test/contract/config-names.test.ts against the',
    ' * committed baseline.',
    ' */',
    'export type ConfigNames =',
    ...names.map(name => `  | '${name}'`),
    '',
    '/**',
    ' * Tripwire. Configs without a name cannot be targeted by consumers, so this',
    ' * number should only ever go down. A non-zero increase in a diff means a new',
    ' * config was added without a name.',
    ' */',
    `export type UnnamedConfigCount = ${unnamed}`
  ].join('\n');

  return [
    {
      path: OUTPUT,
      content: content
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
