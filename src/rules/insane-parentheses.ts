import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {AST_NODE_TYPES, AST_TOKEN_TYPES, ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(_ => '');

type Node = TSESTree.Node;
type RuleContext = TSESLint.RuleContext<'missingParentheses', never[]>;
type RuleFixer = TSESLint.RuleFixer;
type Token = TSESTree.Token;
type SourceCode = TSESLint.SourceCode;

type ParenthesesPair = (
  {
    readonly open: '(';
    readonly close: ')';
  }
  | {
    readonly open: '{';
    readonly close: '}';
  }
  | {
    readonly open: '[';
    readonly close: ']';
  }
  | {
    readonly open: '<';
    readonly close: '>';
  }
);

const PARENTHESES_PAIRS: (readonly ParenthesesPair[]) = ([
  {
    open: '(',
    close: ')'
  },
  {
    open: '{',
    close: '}'
  },
  {
    open: '[',
    close: ']'
  },
  {
    open: '<',
    close: '>'
  }
] as const);

/**
 * Precedence of every binary operator, mirroring the language's own grouping.
 * Only the relative order matters, not the absolute values.
 */
const BINARY_OPERATOR_PRECEDENCE: (Readonly<Record<string, number>>) = ({
  '**': 13,
  '*': 12,
  '/': 12,
  '%': 12,
  '+': 11,
  '-': 11,
  '<<': 10,
  '>>': 10,
  '>>>': 10,
  '<': 9,
  '>': 9,
  '<=': 9,
  '>=': 9,
  in: 9,
  instanceof: 9,
  '==': 8,
  '!=': 8,
  '===': 8,
  '!==': 8,
  '&': 7,
  '^': 6,
  '|': 5
} as const);

/**
 * The operand a parenthesized chain already groups: the left one for the
 * left-associative operators, the right one for `**`, which associates to the
 * right (`a ** b ** c` parses as `a ** (b ** c)`).
 */
const associativeOperand = ((parent: TSESTree.BinaryExpression): Node =>
  ((parent.operator === '**') ? parent.right : parent.left)
);

/**
 * Checks if a node is already wrapped.
 */
const isAlreadyWrapped = ((
  node: Node,
  context: RuleContext
): boolean => {
  const sourceCode: SourceCode = context.sourceCode;
  const tokenBefore: (Token | null) = sourceCode.getTokenBefore(node);
  const tokenAfter: (Token | null) = sourceCode.getTokenAfter(node);

  if(!tokenBefore || !tokenAfter) {
    return false;
  }

  if((tokenBefore.type !== AST_TOKEN_TYPES.Punctuator) || (tokenAfter.type !== AST_TOKEN_TYPES.Punctuator)) {
    return false;
  }

  return PARENTHESES_PAIRS.some((pair: ParenthesesPair): boolean => ((tokenBefore.value === pair.open) && (tokenAfter.value === pair.close)));
});

/**
 * Checks if a node is in a context where it's already grouped.
 */
const isAlreadyInGroupedContext = ((
  node: Node,
  parent: (Node | undefined)
): boolean => {
  if(!parent) {
    return false;
  }

  // A union/intersection nested directly inside the SAME operator is flattened
  // by the parser, so the parent's parentheses already group it. Skipping here
  // is what prevents `string | number | null` from becoming
  // `((string | number) | null)`. Different operators (e.g. an intersection
  // inside a union) are NOT skipped — those get their own parentheses so
  // precedence stays explicit: `a | b & c` -> `(a | (b & c))`.
  if(((node.type === AST_NODE_TYPES.TSUnionType) && (parent.type === AST_NODE_TYPES.TSUnionType))
    || ((node.type === AST_NODE_TYPES.TSIntersectionType) && (parent.type === AST_NODE_TYPES.TSIntersectionType))) {
    return true;
  }

  // A binary expression nested in a SAME-PRECEDENCE binary expression is
  // already grouped by the parent's parentheses, because the language groups
  // the chain exactly the same way: `a + b - c` parses as `(a + b) - c`.
  // Skipping here keeps a flat chain wrapped once — `(a + b - c)` — instead of
  // nesting a pair per operator, and is the arithmetic counterpart of the
  // union/intersection flattening above. A tighter-binding operand is NOT
  // skipped: it gets its own parentheses so precedence stays explicit,
  // `a + b * c` -> `(a + (b * c))`.
  if((node.type === AST_NODE_TYPES.BinaryExpression) && (parent.type === AST_NODE_TYPES.BinaryExpression)) {
    const nodePrecedence = BINARY_OPERATOR_PRECEDENCE[node.operator];
    const parentPrecedence = BINARY_OPERATOR_PRECEDENCE[parent.operator];

    if((nodePrecedence !== undefined) && (nodePrecedence === parentPrecedence) && (associativeOperand(parent) === node)) {
      return true;
    }
  }

  // Already in `if` statement condition.
  if((parent.type === AST_NODE_TYPES.IfStatement) && (parent.test === node)) {
    return true;
  }

  // Already in `for` statement condition.
  if((parent.type === AST_NODE_TYPES.ForStatement) && (parent.test === node)) {
    return true;
  }

  // Already in `while` statement condition.
  if((parent.type === AST_NODE_TYPES.WhileStatement) && (parent.test === node)) {
    return true;
  }

  // Already in function call arguments.
  if((parent.type === AST_NODE_TYPES.CallExpression) && parent.arguments.includes(node as TSESTree.CallExpressionArgument) && (parent.arguments.length === 1)) {
    return true;
  }

  // Already in array literal.
  if((parent.type === AST_NODE_TYPES.ArrayExpression) && (parent.elements.includes(node as (TSESTree.SpreadElement | TSESTree.Expression)))) {
    return true;
  }

  // Already in JSX attribute value.
  if((parent.type === AST_NODE_TYPES.JSXAttribute) && (parent.value === node)) {
    return true;
  }

  // Already in template literal expression.
  if(((parent.type === AST_NODE_TYPES.TemplateLiteral)) && (parent.expressions.includes(node as TSESTree.Expression))) {
    return true;
  }

  // Already in TypeScript template literal.
  if(parent.type === AST_NODE_TYPES.TSTemplateLiteralType) {
    return true;
  }

  // Already part of a larger logical expression with same operator.
  if((parent.type === AST_NODE_TYPES.LogicalExpression) && (node.type === AST_NODE_TYPES.LogicalExpression)) {
    const parentOp = parent.operator;
    const nodeOp = node.operator;

    // Skip wrapping if it's the same logical operator (|| with || or && with
    // &&).
    if(parentOp === nodeOp) {
      return true;
    }
  }

  return false;
});

/**
 * Checks if a node needs parentheses.
 */
const needsParentheses = ((
  node: Node,
  parent: (Node | undefined),
  context: RuleContext
): boolean => {
  // Skip if already wrapped or in a grouped context.
  if(isAlreadyWrapped(node, context) || isAlreadyInGroupedContext(node, parent)) {
    return false;
  }

  // Binary expressions (comparisons, logical operations, arithmetic).
  if((node.type === AST_NODE_TYPES.BinaryExpression) || (node.type === AST_NODE_TYPES.LogicalExpression)) {
    return true;
  }

  // Conditional expressions (ternary).
  if(node.type === AST_NODE_TYPES.ConditionalExpression) {
    return true;
  }

  // Arrow functions.
  if(node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    return true;
  }

  // New expressions.
  if(node.type === AST_NODE_TYPES.NewExpression) {
    return true;
  }

  // `await` used as a value: `const x = (await f());`, `return (await f());`.
  // A statement that is nothing but an `await` is left alone — there is no
  // surrounding expression for the parentheses to separate it from, so
  // `await f();` stays as it is.
  if(node.type === AST_NODE_TYPES.AwaitExpression) {
    return (parent?.type !== AST_NODE_TYPES.ExpressionStatement);
  }

  // TypeScript: Conditional types.
  if(node.type === AST_NODE_TYPES.TSConditionalType) {
    return true;
  }

  // TypeScript: `infer` type.
  if(node.type === AST_NODE_TYPES.TSInferType) {
    return true;
  }

  // TypeScript: Type assertions (`as` expressions).
  if(node.type === AST_NODE_TYPES.TSAsExpression) {
    return true;
  }

  // TypeScript: Type assertions (`satisfies` expressions).
  if(node.type === AST_NODE_TYPES.TSSatisfiesExpression) {
    return true;
  }

  // TypeScript: `typeof` operator.
  if(node.type === AST_NODE_TYPES.TSTypeOperator) {
    return true;
  }

  // TypeScript: union / intersection types. The whole n-ary node is wrapped
  // once (`a | b | c` -> `(a | b | c)`); a nested different-operator member is
  // wrapped on its own to keep precedence explicit.
  if((node.type === AST_NODE_TYPES.TSUnionType) || (node.type === AST_NODE_TYPES.TSIntersectionType)) {
    return true;
  }

  return false;
});

/**
 * Creates a fixer function to add parentheses.
 */
const createFixer = ((
  node: Node,
  fixer: RuleFixer
): (readonly TSESLint.RuleFix[]) => ([
  fixer.insertTextBefore(node, '('),
  fixer.insertTextAfter(node, ')')
] as const));

type RuleListeners = TSESLint.RuleListener;

interface MessageIds {
  readonly missingParentheses: 'missingParentheses';
}

export default createRule<never[], (keyof MessageIds)>({
  name: 'insane-parentheses',
  meta: {
    type: 'layout',
    docs: {description: 'Enforce extra parentheses around expressions for clarity'},
    fixable: 'code',
    schema: [],
    messages: {missingParentheses: 'Expression should be wrapped in parentheses'}
  },
  defaultOptions: [],
  create: ((context: RuleContext): RuleListeners => {
    const handleNode = ((node: Node): void => {
      if(needsParentheses(node, node.parent, context)) {
        context.report({
          node: node,
          messageId: 'missingParentheses',
          fix: ((fixer: RuleFixer): (readonly TSESLint.RuleFix[]) => createFixer(node, fixer))
        });
      }
    });

    return {
      BinaryExpression: handleNode,
      LogicalExpression: handleNode,
      ConditionalExpression: handleNode,
      ArrowFunctionExpression: handleNode,
      NewExpression: handleNode,
      AwaitExpression: handleNode,
      TSConditionalType: handleNode,
      TSInferType: handleNode,
      TSAsExpression: handleNode,
      TSSatisfiesExpression: handleNode,
      TSTypeOperator: handleNode,
      TSUnionType: handleNode,
      TSIntersectionType: handleNode
    };
  })
});
