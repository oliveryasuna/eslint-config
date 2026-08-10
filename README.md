# @oliveryasuna/eslint-config

[![npm](https://img.shields.io/npm/v/@oliveryasuna/eslint-config?logo=npm)](https://www.npmjs.com/package/@oliveryasuna/eslint-config)

An ESLint flat config for TypeScript, JavaScript, and the data formats around
them. Structurally derived from [`@antfu/eslint-config`][antfu] `9.3.0`, then
rewritten around one rule: **nothing is inferred.**

The resolved config is a function of the options you pass and nothing else — not
your lockfile, not your working directory, not your environment variables. If a
module is on, it is on because you can see it in your config file.

> **Status:** the source is complete, dogfooded (this repo lints itself), and
> builds to a publishable package. Not yet covered: `test/` is empty and there is
> no CI workflow. See [Not yet wired](#not-yet-wired).

[antfu]: https://github.com/antfu/eslint-config

## Install

```bash
bun add -D eslint @oliveryasuna/eslint-config
```

Requires ESLint `^9.10.0 || ^10.0.0`. Every plugin the default modules use ships
as a direct dependency, so the presets work with nothing else installed — and
nothing is ever installed on your behalf.

Two opt-in areas declare optional peers instead, since most projects need
neither:

```bash
# react: true
bun add -D @eslint-react/eslint-plugin eslint-plugin-react-hooks
bun add -D eslint-plugin-jsx-a11y eslint-plugin-react-refresh eslint-plugin-react-compiler

# test: {framework: 'jest' | 'node'}
bun add -D eslint-plugin-jest
```

Enable one without its plugin and you get a `MissingPeerError` naming the
package to install and the option that turns the module off. Never a prompt,
never an automatic install.

## Usage

```ts
// eslint.config.ts
import {defineConfig} from '@oliveryasuna/eslint-config';

export default defineConfig({
  preset: 'recommended'
});
```

Pass your own flat configs as additional arguments — they are appended after
everything this package emits, so they win:

```ts
export default defineConfig(
  {
    preset: 'strict',
    typescript: {
      typeAware: true,
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  },
  {
    name: 'local/scripts',
    files: ['scripts/**/*.ts'],
    rules: {'no-console': 'off'}
  }
);
```

`defineConfig` returns a `FlatConfigComposer`, so `.override()`, `.append()`,
`.renamePlugins()` and friends are all available.

## Presets

A preset is a plain `OptionsConfig` object, not a function — diffable,
spreadable, and snapshot-testable. Your own options are merged one level deep on
top of whichever preset you name.

| Preset | Intent |
| --- | --- |
| `minimal` | Correctness only. No TypeScript, no formatting, no sorting. |
| `recommended` | The default. Everything language-agnostic, plus data formats. TypeScript on, type-aware off. |
| `strict` | `recommended` + the type-aware rule set and project discovery. |
| `library` | `strict` + `type: 'lib'`: explicit return types on the public surface, `no-console` as an error. |

`FULL_ON` and `FULL_OFF` also exist, but they are generator and test fixtures
rather than consumer-facing presets.

Type-aware linting requires a resolvable TypeScript program and is meaningfully
slower, so it is never a default — `strict` turns it on because you asked for
`strict`, not because a tsconfig happened to be present.

## Options

```ts
defineConfig({
  namespace: 'oliveryasuna',   // prefix for every emitted config name
  preset: 'recommended',
  type: 'app',                 // 'app' | 'lib'
  channel: 'stable',           // 'stable' | 'next' — see Release channel
  ignores: defaults => [...defaults, 'vendor'],
  overlays: COMMON_OVERLAYS,   // opt-in, off by default
  isInEditor: false,           // never inferred

  // Per-module: false | true | { …options }
  typescript: {typeAware: true},
  react: false,

  // Sugar for per-module `overrides`
  overrides: {
    unicorn: {'unicorn/prefer-node-protocol': 'off'}
  }
});
```

There is deliberately no top-level `files`. A global file scope is meaningless
in flat config — scope belongs to individual config objects — and accepting one
would invite configs that silently do nothing. Passing it throws with a message
showing the correct shape.

### Modules

Every module is `(options & ModuleContext) => Promise<TypedFlatConfigItem[]>`,
and every one is pure: no filesystem, no `process.env`, no network, no logging.

| Module | Default | Notes |
| --- | --- | --- |
| `javascript` | on | Core rules, ES/Node/browser globals, `RESTRICTED_SYNTAX` |
| `typescript` | on | `typeAware` and `projectService` are separate options |
| `comments` | on | `@eslint-community/eslint-comments` |
| `imports` | on | `import-x` + `unused-imports` |
| `node` | on | `eslint-plugin-n` |
| `unicorn` | on | Minus `UNICORN_DISABLED` — the identifier-renaming ones |
| `regexp` | on | Backtracking rules stay at `error` in every preset |
| `jsdoc` | on | |
| `jsx` | on | |
| `perfectionist` | on | Sorting, `warn` by default |
| `stylistic` | on | `@stylistic` |
| `test` | on | `vitest` \| `jest` \| `node` |
| `jsonc` | on | JSON, JSONC and JSON5 |
| `yaml` / `toml` | on | |
| `markdown` | on | Optional fenced-code-block linting |
| `react` | **off** | `@eslint-react`, hooks, refresh, optional a11y and compiler |

`ignores` is always applied and is not a toggleable module.

### TypeScript

The one option split worth calling out: **which rules** and **how the program is
discovered** are independent.

```ts
typescript: {
  typeAware: true,          // selects the type-aware RULE SET
  projectService: true,     // project DISCOVERY (recommended)
  // project: './tsconfig.json',   // legacy discovery; mutually exclusive
  tsconfigRootDir: import.meta.dirname,
  erasableOnly: false,      // reject enum/namespace/parameter properties
  filesTypeAware: [...],
  ignoresTypeAware: [...],
  overridesTypeAware: {...}
}
```

Setting both `projectService` and `project` throws rather than silently
preferring one. `tsconfigRootDir` anchors to your config file's directory, never
`process.cwd()` — otherwise type-aware linting would depend on where the command
was invoked from.

`projectService` is the default when `typeAware` is true, so it rarely needs to
be written out.

#### Multiple tsconfigs

TypeScript's project service finds the **nearest `tsconfig.json`** for each file.
Everything below follows from that one fact.

**A root config that `references` the others — nothing to configure.**

```
tsconfig.json          → { "files": [], "references": [{ "path": "./tsconfig.lib.json" },
                                                       { "path": "./tsconfig.test.json" }] }
tsconfig.lib.json      → { "compilerOptions": { "composite": true }, "include": ["src/**/*.ts"] }
tsconfig.test.json     → { "compilerOptions": { "composite": true }, "include": ["test/**/*.ts"] }
```

```ts
typescript: {typeAware: true, tsconfigRootDir: import.meta.dirname}
```

The service finds `tsconfig.json` and follows its references, so files in both
projects are type-checked. `composite: true` is required — project references
demand it anyway.

**A monorepo with one `tsconfig.json` per package — also nothing to configure.**
Each file's nearest config is its own package's.

**Named configs that nothing references** — a bare `tsconfig.test.json` beside an
unrelated `tsconfig.json` — are invisible to the service, and files matched only
by them fail with `was not found by the project service`. Two fixes:

```ts
// Name them explicitly, via the legacy strategy
typescript: {typeAware: true, project: ['./tsconfig.json', './tsconfig.test.json']}

// Or let the stragglers fall back to the default project
typescript: {typeAware: true, projectService: {allowDefaultProject: ['test/*.ts']}}
```

Prefer the first for whole directories. The default project is capped by
`maximumDefaultProjectFileMatchCount`, so `allowDefaultProject` suits a handful
of loose files, not a tree.

## Overlays

Path-scoped rule relaxations, expressed as data. Nothing is applied by default.

```ts
import {COMMON_OVERLAYS, defineConfig, DTS_OVERLAY, SCRIPTS_OVERLAY} from '@oliveryasuna/eslint-config';

export default defineConfig({
  overlays: [DTS_OVERLAY, SCRIPTS_OVERLAY]   // or COMMON_OVERLAYS for all six
});
```

Shipped: `dts`, `cjs`, `config-files`, `scripts`, `bin`, `test`. Each carries a
required `why` string that is rendered into `RULES.md`, so the inventory is
reviewable — an overlay without a stated reason is indistinguishable from an
accident. Writing your own is just an object:

```ts
{
  id: 'generated',
  files: ['src/generated/**'],
  rules: {'unused-imports/no-unused-vars': 'off'},
  why: 'Generated sources are not hand-edited.'
}
```

Overlays are emitted last, so their relaxations win over the module that set the
rule.

## Release channel

A shared config that treats "enabled a new rule" as a non-breaking change will
eventually break someone's CI on a patch bump.

New rules are registered in `PENDING_RULES` with a `promoteIn` major. On the
`stable` channel (the default) they are emitted at `warn` until that major
ships; on `next` they are emitted at their intended severity immediately.

```ts
defineConfig({channel: 'next'})
```

Every config module runs its rule table through `applySeverity`, so a module
author cannot forget the ramp for an individual rule.

## Config names

Config names are public API — `.override()` targets them — so they are built
from a parameterized namespace rather than hardcoded strings:

```
<namespace>/<module>[/<purpose>]

oliveryasuna/typescript/rules
oliveryasuna/markdown/processor
oliveryasuna/overlay-dts/overlay
```

`purpose` is a closed vocabulary: `setup`, `parser`, `rules`, `type-aware`,
`overrides`, `overlay`, `processor`. The full set of emitted names is generated
into `generated/config-names.d.ts` as the `ConfigNames` union, so `.override()`
autocompletes and rejects typos:

```ts
export default defineConfig({preset: 'strict'})
  .override('oliveryasuna/typescript/rules', {
    rules: {'@typescript-eslint/no-explicit-any': 'error'}
  });
```

`parseName` and `isOwnedName` are exported so tooling can tell this package's
configs apart from your own.

## Plugin prefixes

Plugins are registered under their published names — `@typescript-eslint`, not
`ts`; `n`, not `node`; `import-x`, not `import`. No renaming is applied, ever, by
default. A rename invalidates every `eslint-disable` comment written against the
original id, and it makes rule ids in this config disagree with the plugin's own
documentation.

The one deliberate alias is the `test` module, which registers whichever
framework plugin you selected under a neutral `test` prefix — so switching
`framework: 'vitest'` to `'jest'` doesn't rewrite every rule id in your
overrides.

If you want short prefixes in your own repository, the composer already does it:

```ts
defineConfig({...}).renamePlugins({'@typescript-eslint': 'ts'})
```

## Custom rules

Five rules are implemented in-repo and registered under the `custom/` prefix by
the `typescript` module:

| Rule | Enforces |
| --- | --- |
| `custom/comment-length-limit` | Comments do not exceed column 80 |
| `custom/two-spaces-before-inline-comment` | At least two spaces before an end-of-line comment |
| `custom/insane-parentheses` | Extra parentheses around expressions, for explicit precedence |
| `custom/one-parameter-per-line` | One parameter per line, closing paren on its own line |
| `custom/multiline-arguments` | Same, for call arguments |

These encode a personal formatting dialect. They are opinionated by design, and
they are the reason `@stylistic` alone was not sufficient.

## Generated artifacts

Three files are generated and **committed**, so a change to the rule surface
shows up in the PR diff rather than at build time:

| File | Contents |
| --- | --- |
| `generated/rules.d.ts` | `RuleOptions` — every rule id and its options type |
| `generated/config-names.d.ts` | `ConfigNames` — every emitted config name |
| `RULES.md` | Full inventory: every rule, its severity per preset, its owning module, rationale |

```bash
bun run gen        # regenerate all three
bun run gen:check  # fail if any are stale
```

`RULES.md` is built by resolving the real config at runtime, not by parsing the
source, and it merges in the rationale table from `src/meta/notes.ts` — so
"why is this rule off?" has an answer in version control.

## Environment detection

`isInEditor` is an option, not a behavior. The detection helpers exist and are
exported, but the factory never calls them:

```ts
import {defineConfig, isInEditor} from '@oliveryasuna/eslint-config';

export default defineConfig({
  isInEditor: isInEditor()   // your call, visible in your config file
});
```

When enabled, rules whose autofix is destructive mid-edit (`prefer-const`,
`unused-imports/no-unused-imports`, focused-test rules) have their fixers
disabled — not the rules themselves.

---

## Differences from `@antfu/eslint-config`

The structure, the module decomposition, and a good deal of the rule selection
come from antfu's config. What changed is everything that made the resolved
output depend on something other than the options object.

### Inverted defaults

| | `@antfu/eslint-config` | This package |
| --- | --- | --- |
| **Dependency detection** | `typescript` enabled by `isPackageExists('typescript')`; `vue` by probing for `vue`/`nuxt`/`vitepress`/`@slidev/cli`; `pnpm` by `findUpSync('pnpm-workspace.yaml')` | Static `MODULE_DEFAULTS` table. Nothing probes the filesystem or the dependency tree. |
| **Editor detection** | `isInEditorEnv()` called automatically; sniffs `VSCODE_PID`, `JETBRAINS_IDE`, `VIM`, … | `isInEditor` must be passed. The helper is exported for you to call. |
| **Package auto-install** | `ensurePackages()` prompts via `@clack/prompts` and installs with `@antfu/install-pkg` | Never. A missing peer throws `MissingPeerError` naming the install command and the option that disables the module. |
| **Plugin renaming** | `autoRenamePlugins = true` — `@typescript-eslint`→`ts`, `@stylistic`→`style`, `n`→`node`, `vitest`→`test`, `yml`→`yaml`, … | Off. Published names are kept. Opt in via `.renamePlugins()`. |
| **Logging** | `console.log` on editor detection — which corrupts `eslint -f json` | The factory writes nothing to stdout. |

Resolving a lint config should not have side effects. Those five rows are the
whole thesis.

### Structural changes

| Area | Change |
| --- | --- |
| **Presets** | Upstream's `CONFIG_PRESET_FULL_ON/OFF` exist only as fixtures. Here `minimal`/`recommended`/`strict`/`library` are the primary consumer surface — a coarse-grained contract that survives rule churn. |
| **`disables.ts` → overlays** | Upstream hardcodes `**/scripts/**`, `**/cli/**`, `**/bin/**` — one repository's layout baked into a config every consumer inherits. Here they are opt-in data with a required `why`. |
| **Config names** | Upstream hardcodes `'antfu/typescript/rules'` across ~60 files, so a fork needs a global find-and-replace despite those names being the public `.override()` API. Here a `namespace` option feeds `buildName`. |
| **Type-aware gating** | Upstream gates the type-aware rule set on `!!tsconfigPath`, so there is no way to use the recommended `projectService: true` setup *and* get type-aware rules. Here `typeAware` (which rules) and `projectService`/`project` (how the program is found) are orthogonal, and setting both discovery strategies throws. |
| **Generated output** | Upstream generates `src/typegen.d.ts` at build time. Here `generated/` and `RULES.md` are committed, plus a `gen:check` staleness gate. |
| **Plugin preset interop** | Upstream hand-merges `pluginTs.configs.strict.rules!`. Here `src/interop/extends.ts` normalizes the shapes plugins actually ship (single object, flat array, nested array) via `asConfigArray`/`pickRules`/`mergeRules`. |
| **Options validation** | `assertNoFiles` and `assertExclusive` throw with actionable messages instead of silently preferring one interpretation. |

### Scope

Narrower on frameworks, deeper on the core:

- **Dropped:** Vue, Svelte, Astro, Solid, Angular, Next.js, UnoCSS, pnpm
  workspace, `command`, `e18e`, and the `sort` module — `package.json` and
  `tsconfig.json` key ordering is a repository convention, not something a lint
  config should decide.
- **Dropped:** the interactive setup wizard (`bin/`, `src/cli/`). A scaffolder is
  a separate concern from a config; bundling one drags `@clack/prompts`,
  `@antfu/install-pkg`, and `cac` into every consumer's dependency graph.
- **Dropped:** `src/vender/`. Vendored third-party types are a maintenance tax.
- **Kept:** React, with optional a11y and compiler support.

## What's new here

Things with no upstream counterpart at all:

- **Release channel / `PENDING_RULES`.** A newly added rule ships at `warn` for
  one major cycle so a minor upgrade cannot break a consumer's build. Upstream
  documents a versioning policy in prose; this is the mechanism.
- **Overlays as data**, with a required justification rendered into `RULES.md`.
- **`RULES.md`.** A generated, reviewable inventory of every rule across every
  preset, with severities and rationale.
- **`namespace` option** and the `parseName`/`isOwnedName` helpers.
- **Five custom rules** (`src/rules/`), enforcing a comment and call-layout
  dialect that `@stylistic` does not cover.
- **`src/meta/notes.ts`.** A rationale table for the non-obvious rule decisions —
  why `unicorn/no-null` is off, why `no-unsafe-assignment` stays off even in
  `strict`.
- **`erasableOnly`.** Restricts syntax to what a type-stripping runtime can
  erase (`enum`, `namespace`, parameter properties are reported).
- **`noOnly`** as its own severity option — the one rule whose correct severity
  genuinely differs between local editing and CI.
- **`type: 'lib'`**, affecting the rules whose right answer differs between code
  read by humans and code consumed by other packages.
- **Bun toolchain.** Pinned via `.bun-version` and checked on `prepare`; husky +
  lint-staged, syncpack, and secretlint on commit.

---

## Development

```bash
bun install
bun run lint        # this config, linting itself
bun run typecheck
bun run gen         # regenerate generated/ and RULES.md
bun run gen:check   # verify they are current
bun run build       # gen, then bundle
```

Bun is pinned by `.bun-version` and checked by `check:bun`, which `prepare`
runs on install — a mismatched toolchain fails before it can produce a
confusing error. `prepare` also runs `format:pkg` (syncpack) and installs the
git hooks.

Nothing runs on a consumer's machine. `prepare` and `prepack` are skipped when
this package is installed as a dependency, and there are deliberately no
`preinstall`/`postinstall` scripts — a config that reformats your
`package.json` while you install it would be the same class of hidden side
effect this package exists to avoid.

`eslint.config.ts` is the dogfood: every option exercised there is one a
consumer could hit, and a config that cannot lint its own source is not one
anyone should adopt.

### Build

`tsdown` bundles `src/index.ts` to ESM only — there is no CommonJS output, in a
package whose entire consumer surface is an ESM config file:

| Artifact | Referenced by |
| --- | --- |
| `dist/index.mjs` | `main`, `module`, `exports["."].default` |
| `dist/index.d.mts` | `exports["."].types` |

`bun run build` runs `gen` first, so a build can never ship a stale
`generated/rules.d.ts` or `RULES.md`. `prepack` runs the whole build, so
`npm publish` cannot ship a stale or missing `dist/` either — which matters
because `dist/` is gitignored.

The published tarball is `dist/`, `package.json`, `RULES.md`, `README.md` and
`LICENSE` — about 180 kB.

### Not yet wired

Honest gaps, so nobody discovers them the hard way:

- `test/` is empty despite the `test` script. Snapshot, fixture, and contract
  suites are planned but do not exist yet.
- No CI workflow, so `gen:check` and `typecheck` are not enforced anywhere.
- `gitignore` is declared in `OptionsConfig` but not read by the factory.

## License

MIT © Oliver Yasuna
