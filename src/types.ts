import type {RuleOptions} from '../generated/rules';
import type {Linter} from 'eslint';
import type {ConfigWithExtends, ResolvableFlatConfig as UtilsResolvableFlatConfig} from 'eslint-flat-config-utils';

//==================================================
// Primitives
//==================================================

type Awaitable<T> = (T | Promise<T>);
type Arrayable<T> = (T | T[]);

/**
 * Normalized severity. The numeric forms (0/1/2) are accepted on input by
 * ESLint but never emitted by this package — generators and snapshots compare
 * strings, and mixing the two forms would produce spurious diffs.
 */
type Severity = ('off' | 'warn' | 'error');

type RuleEntry = (Severity | [Severity, ...unknown[]]);

//==================================================
// Config items
//==================================================

/**
 * A flat config item with `rules` narrowed to the generated `RuleOptions` map,
 * and with `extends` permitted so config modules can compose plugin presets
 * rather than hand-merging their rule records.
 */
interface TypedFlatConfigItem extends Omit<ConfigWithExtends, ('rules' | 'name')> {
  /**
   * PUBLIC API. `.override(name, …)` targets this string; see
   * `generated/config-names.d.ts`.
   */
  name?: string;
  rules?: Partial<Linter.RulesRecord & RuleOptions>;
}

type ResolvableFlatConfig = UtilsResolvableFlatConfig<TypedFlatConfigItem>;

/**
 * The plugin and parser shapes accepted by a flat config item, derived from the
 * config type itself rather than from `ESLint.Plugin`. Deriving them keeps
 * `interop/lazy.ts` assignable to `TypedFlatConfigItem` without casts.
 */
type AnyPlugin = NonNullable<TypedFlatConfigItem['plugins']>[string];
type AnyParser = NonNullable<NonNullable<TypedFlatConfigItem['languageOptions']>['parser']>;
type AnyProcessor = NonNullable<TypedFlatConfigItem['processor']>;

//==================================================
// Module contract
//==================================================

/**
 * The trailing segment of a config name. Fixed set rather than free string so
 * that `parseName` round-trips and so the purpose column in RULES.md is a
 * closed vocabulary.
 */
type ConfigPurpose =
  ('setup'
    | 'parser'
    | 'rules'
    | 'type-aware'
    | 'overrides'
    | 'overlay'
    | 'processor');

type NameFactory = ((module: string, purpose?: ConfigPurpose) => string);

/**
 * Applied to every rule entry a config module emits. This is the mechanism
 * behind the release-channel contract: on the `stable` channel a newly added
 * rule is downgraded to `warn` for one major cycle before it can break a
 * consumer's build.
 */
type SeverityResolver = ((rule: string, intended: RuleEntry) => RuleEntry);

/**
 * Threaded into every config module by the factory. Modules are otherwise pure:
 * no filesystem, no environment, no logging.
 */
interface ModuleContext {
  name: NameFactory;
  severity: SeverityResolver;
}

type ConfigModule<TOptions extends object = object> = ((options: (TOptions & ModuleContext)) => Promise<TypedFlatConfigItem[]>);

export type {
  Awaitable,
  Arrayable,
  Severity,
  RuleEntry,
  TypedFlatConfigItem,
  ResolvableFlatConfig,
  AnyPlugin,
  AnyParser,
  AnyProcessor,
  ConfigPurpose,
  NameFactory,
  SeverityResolver,
  ModuleContext,
  ConfigModule
};

// TODO: Remove re-exports.
export {
  type ConfigNames
} from '../generated/config-names';
export {
  type RuleOptions
} from '../generated/rules';
