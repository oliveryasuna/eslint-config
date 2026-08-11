import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {AST_TOKEN_TYPES, ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(_ => '');

type CallNode = (
  TSESTree.CallExpression
  | TSESTree.NewExpression
);
type MessageId = ('argumentNotOnOwnLine' | 'closingParenthesisNotOnOwnLine');
type RuleContext = TSESLint.RuleContext<MessageId, never[]>;
type RuleFixer = TSESLint.RuleFixer;
type RuleFix = TSESLint.RuleFix;
type Token = TSESTree.Token;
type SourceCode = TSESLint.SourceCode;

const isPunctuator = ((
  token: Token,
  value: string
): boolean => ((token.type === AST_TOKEN_TYPES.Punctuator) && (token.value === value)));

/**
 * The `(` that opens the argument list. Anchored after the type arguments (or
 * the callee) so it is the call's own parenthesis, not one wrapping the callee
 * or a first argument.
 */
const openingParenthesis = ((
  node: CallNode,
  sourceCode: SourceCode
): (Token | null) => {
  const afterCallee = (node.typeArguments ?? node.callee);
  return sourceCode.getTokenAfter(afterCallee, {filter: ((token): boolean => isPunctuator(token, '('))});
});

/**
 * Require a newline between `before` and `after` when they share a line. The
 * fix replaces the whitespace between them with a newline; `@stylistic/indent`
 * fixes the indentation afterwards.
 *
 * Anchoring on separator tokens (the opening `(` or a `,`) — rather than on the
 * argument node — keeps parenthesized arguments intact: `(rule as any)` moves as
 * a whole, instead of being split after its opening paren.
 */
const requireNewlineBetween = ((
  context: RuleContext,
  before: Token,
  after: Token,
  messageId: MessageId
): void => {
  if(after.loc.start.line > before.loc.end.line) {
    return;
  }

  context.report({
    loc: after.loc,
    messageId: messageId,
    fix: ((fixer: RuleFixer): RuleFix => fixer.replaceTextRange(
      [
        before.range[1],
        after.range[0]
      ],
      '\n'
    ))
  });
});

// eslint-disable-next-line max-statements -- Expected.
const checkCall = ((
  node: CallNode,
  context: RuleContext
// eslint-disable-next-line complexity -- Expected.
): void => {
  const args = node.arguments;
  if(args.length <= 1) {
    return;
  }

  const sourceCode = context.sourceCode;
  const openParen = openingParenthesis(node, sourceCode);
  const closeParen = sourceCode.getLastToken(node);
  if(!openParen || !closeParen || !isPunctuator(closeParen, ')')) {
    return;
  }

  const firstToken = sourceCode.getTokenAfter(openParen);
  const lastToken = sourceCode.getTokenBefore(closeParen);
  if(!firstToken || !lastToken) {
    return;
  }

  // Only reformat calls whose arguments already span multiple lines (measured on
  // tokens, so wrapping parentheses are included). Single-line calls are left
  // inline.
  if(firstToken.loc.start.line === lastToken.loc.end.line) {
    return;
  }

  // First argument: newline after the opening `(`.
  requireNewlineBetween(context, openParen, firstToken, 'argumentNotOnOwnLine');

  // Each subsequent argument: newline after its preceding `,`.
  for(const arg of args.slice(1)) {
    const comma = sourceCode.getTokenBefore(arg, {filter: ((token): boolean => isPunctuator(token, ','))});
    const afterComma = (comma && sourceCode.getTokenAfter(comma));
    if(comma && afterComma) {
      requireNewlineBetween(context, comma, afterComma, 'argumentNotOnOwnLine');
    }
  }

  // Closing `)`: newline after the last argument's final token.
  requireNewlineBetween(context, lastToken, closeParen, 'closingParenthesisNotOnOwnLine');
});

interface MessageIds {
  readonly argumentNotOnOwnLine: 'argumentNotOnOwnLine';
  readonly closingParenthesisNotOnOwnLine: 'closingParenthesisNotOnOwnLine';
}

export default createRule<never[], (keyof MessageIds)>({
  name: 'multiline-arguments',
  meta: {
    type: 'layout',
    docs: {description: 'Require each argument (and the closing parenthesis) on its own line when a call spans multiple lines and has more than one argument'},
    fixable: 'whitespace',
    schema: [],
    messages: {
      argumentNotOnOwnLine: 'Each argument must be on its own line when a multiline call has more than one argument.',
      closingParenthesisNotOnOwnLine: 'The closing parenthesis must be on its own line when a multiline call has more than one argument.'
    }
  },
  defaultOptions: [],
  create: ((context: RuleContext): TSESLint.RuleListener => ({
    CallExpression: ((node): void => {
      checkCall(node, context);
    }),
    NewExpression: ((node): void => {
      checkCall(node, context);
    })
  }))
});
