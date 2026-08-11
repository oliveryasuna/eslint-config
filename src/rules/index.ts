import type {AnyPlugin} from '../types';
/**
 * The in-repo rule plugin.
 *
 * Exported as a single frozen instance because flat config rejects two config
 * objects that register the same plugin name with *different* objects. Every
 * module that needs a `custom/` rule imports this one, so `typescript` and
 * `stylistic` can both register it without colliding.
 */
import commentLengthLimit from './comment-length-limit';
import insaneParentheses from './insane-parentheses';
import multilineArguments from './multiline-arguments';
import oneParameterPerLine from './one-parameter-per-line';
import twoSpacesBeforeInlineComment from './two-spaces-before-inline-comment';

// TODO: Move to a separate package.

/**
 * The single cast is deliberate: `@typescript-eslint/utils` rule modules and
 * ESLint's own `RuleDefinition` disagree on variance in `meta.defaultOptions`
 * and on the context generics, and neither side is wrong. Asserting once here
 * beats repeating a `@ts-expect-error` above every rule at every registration
 * site.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- See above.
const CUSTOM_PLUGIN = (({
  rules: {
    'comment-length-limit': commentLengthLimit,
    'insane-parentheses': insaneParentheses,
    'multiline-arguments': multilineArguments,
    'one-parameter-per-line': oneParameterPerLine,
    'two-spaces-before-inline-comment': twoSpacesBeforeInlineComment
  }
} as unknown) as AnyPlugin);

export {
  CUSTOM_PLUGIN
};
