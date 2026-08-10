import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(_ => '');

type FunctionNode = (
  TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
);
type MessageId = ('parameterNotOnOwnLine' | 'closingParenthesisNotOnOwnLine');
type RuleContext = TSESLint.RuleContext<MessageId, never[]>;
type RuleFixer = TSESLint.RuleFixer;
type RuleFix = TSESLint.RuleFix;

/**
 * Whether this rule governs the function: a `function` declaration, or a
 * function/arrow expression bound to a variable (e.g. `const f = ...`). Inline
 * callbacks, class methods, and object-property functions are intentionally
 * excluded — forcing those to expand vertically hurts more than it helps.
 */
const isGovernedFunction = ((node: FunctionNode): boolean => {
  if(node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return true;
  }

  const parent = node.parent;

  return ((parent.type === AST_NODE_TYPES.VariableDeclarator) && (parent.init === node));
});

/**
 * Report each parameter that shares a line with the token before it (the opening
 * `(` for the first parameter, or the preceding `,` for the rest), so every
 * parameter lands on its own line.
 */
const checkParameterLines = ((
  node: FunctionNode,
  context: RuleContext
): void => {
  const sourceCode = context.sourceCode;

  for(const param of node.params) {
    const tokenBefore = sourceCode.getTokenBefore(param);
    if(!tokenBefore || (param.loc.start.line > tokenBefore.loc.end.line)) {
      continue;
    }

    context.report({
      node: param,
      messageId: 'parameterNotOnOwnLine',
      // Replace the whitespace between the preceding token and the parameter
      // with a newline; `@stylistic/indent` fixes the indentation afterwards.
      fix: ((fixer: RuleFixer): RuleFix => fixer.replaceTextRange(
        [
          tokenBefore.range[1],
          param.range[0]
        ],
        '\n'
      ))
    });
  }
});

/**
 * Report the closing `)` when it shares a line with the last parameter, so the
 * parameter list closes on its own line (matching the one-per-line layout).
 */
const checkClosingParenthesis = ((
  node: FunctionNode,
  context: RuleContext
): void => {
  const sourceCode = context.sourceCode;
  const lastParam = node.params.at(-1);
  if(!lastParam) {
    return;
  }

  const closeParen = sourceCode.getTokenAfter(lastParam, {filter: ((token): boolean => ((token.type === AST_TOKEN_TYPES.Punctuator) && (token.value === ')')))});
  if(!closeParen) {
    return;
  }

  // Compare against the token before `)` (the last token of the last parameter,
  // e.g. its type) rather than the parameter node, whose range may exclude the
  // type annotation.
  const tokenBeforeClose = sourceCode.getTokenBefore(closeParen);
  if(!tokenBeforeClose || (closeParen.loc.start.line > tokenBeforeClose.loc.end.line)) {
    return;
  }

  context.report({
    node: closeParen,
    messageId: 'closingParenthesisNotOnOwnLine',
    fix: ((fixer: RuleFixer): RuleFix => fixer.replaceTextRange(
      [
        tokenBeforeClose.range[1],
        closeParen.range[0]
      ],
      '\n'
    ))
  });
});

const checkFunction = ((
  node: FunctionNode,
  context: RuleContext
): void => {
  if((node.params.length <= 1) || !isGovernedFunction(node)) {
    return;
  }

  checkParameterLines(node, context);
  checkClosingParenthesis(node, context);
});

interface MessageIds {
  readonly parameterNotOnOwnLine: 'parameterNotOnOwnLine';
  readonly closingParenthesisNotOnOwnLine: 'closingParenthesisNotOnOwnLine';
}

export default createRule<never[], (keyof MessageIds)>({
  name: 'one-parameter-per-line',
  meta: {
    type: 'layout',
    docs: {description: 'Require each parameter (and the closing parenthesis) on its own line when a function has more than one parameter'},
    fixable: 'whitespace',
    schema: [],
    messages: {
      parameterNotOnOwnLine: 'Each parameter must be on its own line when a function has more than one parameter.',
      closingParenthesisNotOnOwnLine: 'The closing parenthesis must be on its own line when a function has more than one parameter.'
    }
  },
  defaultOptions: [],
  create: ((context: RuleContext): TSESLint.RuleListener => ({
    FunctionDeclaration: ((node): void => {
      checkFunction(node, context);
    }),
    FunctionExpression: ((node): void => {
      checkFunction(node, context);
    }),
    ArrowFunctionExpression: ((node): void => {
      checkFunction(node, context);
    })
  }))
});
