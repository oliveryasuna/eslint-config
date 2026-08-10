import type {Overlay} from '../overlays/types';
import type {NameFactory, RuleOptions, Severity, SeverityResolver} from '../types';

//==================================================
// Scalars
//==================================================

/**
 * `false` disables a module, `true` enables it with defaults, an object enables
 * it with overrides. Normalized away by `resolveOptions` before any config
 * module sees it.
 */
type ModuleToggle<T extends object = object> = (boolean | T);

/**
 * Release channel. On `stable`, rules newly added to this package are emitted
 * at `warn` for one major cycle before being promoted, so a minor upgrade
 * cannot break a consumer's build. On `next`, they are emitted at their
 * intended severity immediately.
 */
type StrictnessChannel = ('stable' | 'next');

/**
 * Affects rules whose correct answer differs between code that is consumed by
 * humans and code that is consumed by other packages — explicit return types,
 * `no-console`, and dependency classification.
 */
type ProjectType = ('app' | 'lib');

type PresetName = ('minimal' | 'recommended' | 'strict' | 'library');

type ModuleName =
  ('comments'
    | 'imports'
    | 'javascript'
    | 'jsdoc'
    | 'jsonc'
    | 'jsx'
    | 'markdown'
    | 'node'
    | 'perfectionist'
    | 'react'
    | 'regexp'
    | 'stylistic'
    | 'test'
    | 'toml'
    | 'typescript'
    | 'unicorn'
    | 'yaml');

//==================================================
// Shared option fragments
//==================================================

interface OptionsFiles {
  /** Replaces the module's default file scope entirely; it is not merged. */
  files?: string[];
}

interface OptionsOverrides {
  overrides?: Partial<RuleOptions>;
}

interface OptionsHasTypeScript {
  typescript?: boolean;
}

//==================================================
// TypeScript
//==================================================

/**
 * Mirrors the subset of typescript-eslint's `projectService` options this
 * package configures. Declared locally rather than imported so that
 * `src/options` carries no runtime dependency on the TypeScript plugin.
 */
interface ProjectServiceOptions {
  allowDefaultProject?: string[];
  defaultProject?: string;
  loadTypeScriptPlugins?: boolean;
  maximumDefaultProjectFileMatchCount?: number;
}

interface TypeScriptParserOptions {
  ecmaFeatures?: Record<string, boolean>;
  extraFileExtensions?: string[];
  warnOnUnsupportedTypeScriptVersion?: boolean;
  [key: string]: unknown;
}

interface OptionsTypeScript extends OptionsFiles, OptionsOverrides {
  /**
   * Selects the type-aware RULE SET. Independent of project discovery: it is
   * legitimate to run type-aware rules with `projectService: true` and no
   * tsconfig path at all.
   * @default false
   */
  typeAware?: boolean;

  /**
   * Project discovery. `true` is the configuration typescript-eslint
   * recommends. Mutually exclusive with `project`.
   * @default true when `typeAware` is true, otherwise unused
   */
  projectService?: (boolean | ProjectServiceOptions);

  /**
   * Legacy discovery for repositories `projectService` cannot handle.
   * Mutually exclusive with `projectService`; `assertExclusive` throws if both
   * are set rather than silently preferring one.
   */
  project?: (string | string[]);

  /**
   * Anchors relative paths in `project`. Defaults to the directory of the
   * consumer's config file, never `process.cwd()` — cwd would make type-aware
   * linting depend on where the command was invoked from.
   */
  tsconfigRootDir?: string;

  /** Files the type-aware rule set applies to. Defaults to TS and TSX. */
  filesTypeAware?: string[];

  /**
   * Excluded from the type-aware set. Defaults to declaration files and
   * markdown code blocks.
   */
  ignoresTypeAware?: string[];

  /** Overrides applied only to the type-aware config, not the base rules. */
  overridesTypeAware?: Partial<RuleOptions>;

  /**
   * Restricts syntax to what can be erased by a type-stripping runtime
   * (`enum`, `namespace`, parameter properties are reported).
   * @default false
   */
  erasableOnly?: boolean;

  parserOptions?: TypeScriptParserOptions;
}

//==================================================
// Per-module options
//==================================================

interface StylisticOptions {
}

interface OptionsStylistic extends OptionsOverrides {
  stylistic?: (false | StylisticOptions);
}

interface OptionsJavaScript extends OptionsFiles, OptionsOverrides {
  /** Additional globals beyond the ES and Node sets. */
  globals?: Record<string, ('readonly' | 'writable' | 'off')>;
}

interface OptionsImports extends OptionsFiles, OptionsOverrides {
  /** Modules that should not be imported, with a message explaining why. */
  restricted?: Array<{
    name: string;
    message: string;
  }>;
}

interface OptionsReact extends OptionsFiles, OptionsOverrides {
  version?: string;
  compiler?: boolean;
  refresh?: (boolean | {allowConstantExport?: boolean;});
  a11y?: boolean;
}

interface OptionsTest extends OptionsFiles, OptionsOverrides {
  /**
   * `vitest` and `jest` register their plugin under the neutral `test` prefix,
   * so rule ids survive a change of framework. `node` registers no plugin —
   * `node:test` has none worth depending on — and contributes only the test
   * file scope and the overrides slot.
   * @default 'vitest'
   */
  framework?: ('vitest' | 'jest' | 'node');

  /**
   * Severity for focused tests. Kept separate because it is the one rule whose
   * correct severity differs between local editing and CI. Not applied when
   * `framework` is `node`, which has no rule to attach it to.
   */
  noOnly?: Severity;
}

interface OptionsMarkdown extends OptionsFiles, OptionsOverrides {
  /** Lint fenced code blocks as source. */
  codeBlocks?: boolean;
}

interface OptionsPerfectionist extends OptionsFiles, OptionsOverrides {
  /**
   * Severity for the sorting rules. Named `level` rather than `severity`
   * because `ModuleContext.severity` is the channel resolver, and a module
   * receives both.
   * @default 'warn'
   */
  level?: Severity;
}

interface OptionsJsonc extends OptionsFiles, OptionsOverrides {
}

interface GitignoreOptions {
  files?: string[];
  strict?: boolean;
  root?: boolean;
}

//==================================================
// Top level
//==================================================

/**
 * Deliberately has no `files` field. A global file scope is meaningless in flat
 * config — scope belongs to individual config objects — and accepting one would
 * invite consumers to write configs that silently do nothing.
 * `assertNoFiles` rejects it at runtime for anyone passing untyped input.
 */
interface OptionsConfig {
  /**
   * Prefix for every emitted config name. Changing it after release is a
   * breaking change for anyone calling `.override()`.
   * @default 'oliveryasuna'
   */
  namespace?: string;

  /** Starting point; individual options below override the preset's values. */
  preset?: PresetName;

  /** @default 'app' */
  type?: ProjectType;

  /** @default 'stable' */
  channel?: StrictnessChannel;

  /** Replaces the defaults, or transforms them when given a function. */
  ignores?: (string[] | ((defaults: string[]) => string[]));

  gitignore?: (boolean | GitignoreOptions);

  /**
   * Path-scoped relaxations. Off by default; pass `COMMON_OVERLAYS` to opt in.
   */
  overlays?: (Overlay[] | false);

  comments?: ModuleToggle<OptionsOverrides>;
  imports?: ModuleToggle<OptionsImports>;
  javascript?: ModuleToggle<OptionsJavaScript>;
  jsdoc?: ModuleToggle<OptionsOverrides & OptionsStylistic>;
  jsonc?: ModuleToggle<OptionsJsonc>;
  jsx?: ModuleToggle<OptionsFiles & OptionsOverrides>;
  markdown?: ModuleToggle<OptionsMarkdown>;
  node?: ModuleToggle<OptionsOverrides>;
  perfectionist?: ModuleToggle<OptionsPerfectionist>;
  react?: ModuleToggle<OptionsReact>;
  regexp?: ModuleToggle<OptionsOverrides>;
  stylistic?: ModuleToggle<StylisticOptions>;
  test?: ModuleToggle<OptionsTest>;
  toml?: ModuleToggle<OptionsFiles & OptionsOverrides>;
  typescript?: ModuleToggle<OptionsTypeScript>;
  unicorn?: ModuleToggle<OptionsOverrides>;
  yaml?: ModuleToggle<OptionsFiles & OptionsOverrides>;

  /**
   * Rule overrides keyed by module. Equivalent to setting `overrides` inside
   * each module's own options; provided because it reads better when a
   * consumer is only adjusting rules.
   */
  overrides?: Partial<Record<ModuleName, Partial<RuleOptions>>>;

  /**
   * Opt-in. When true, rules whose autofix is destructive mid-edit have their
   * fixers disabled. Never inferred from environment variables — pass
   * `isInEditor()` from `@oly/eslint-config/detect` if that is what you want.
   * @default false
   */
  isInEditor?: boolean;
}

/**
 * The normalized form. Every `ModuleToggle` has collapsed to `false` or a
 * concrete options object, and the two context helpers are constructed.
 * Config modules only ever see this shape.
 */
interface ResolvedOptions {
  namespace: string;
  name: NameFactory;
  severity: SeverityResolver;
  type: ProjectType;
  channel: StrictnessChannel;
  isInEditor: boolean;
  ignores: string[];
  overlays: Overlay[];
  modules: ResolvedModules;
}

/** Per-module resolved options, or `false` when the module is disabled. */
interface ResolvedModules {
  comments: (false | OptionsOverrides);
  imports: (false | OptionsImports);
  javascript: (false | OptionsJavaScript);
  jsdoc: (false | (OptionsOverrides & OptionsStylistic));
  jsonc: (false | OptionsJsonc);
  jsx: (false | (OptionsFiles & OptionsOverrides));
  markdown: (false | OptionsMarkdown);
  node: (false | OptionsOverrides);
  perfectionist: (false | OptionsPerfectionist);
  react: (false | OptionsReact);
  regexp: (false | OptionsOverrides);
  stylistic: (false | StylisticOptions);
  test: (false | OptionsTest);
  toml: (false | (OptionsFiles & OptionsOverrides));
  typescript: (false | OptionsTypeScript);
  unicorn: (false | OptionsOverrides);
  yaml: (false | (OptionsFiles & OptionsOverrides));
}

/** Compile-time proof that `ResolvedModules` covers exactly `ModuleName`. */
type AssertModuleCoverage =
  ((keyof ResolvedModules) extends ModuleName
    ? (ModuleName extends (keyof ResolvedModules)
        ? true
        : never)
    : never);

export type {
  ModuleToggle,
  StrictnessChannel,
  ProjectType,
  PresetName,
  ModuleName,
  OptionsFiles,
  OptionsOverrides,
  OptionsHasTypeScript,
  ProjectServiceOptions,
  TypeScriptParserOptions,
  OptionsTypeScript,
  StylisticOptions,
  OptionsStylistic,
  OptionsJavaScript,
  OptionsImports,
  OptionsReact,
  OptionsTest,
  OptionsMarkdown,
  OptionsPerfectionist,
  OptionsJsonc,
  GitignoreOptions,
  OptionsConfig,
  ResolvedOptions,
  ResolvedModules,
  AssertModuleCoverage
};
