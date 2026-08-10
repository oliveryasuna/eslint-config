import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {AST_TOKEN_TYPES, ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((_name: string): string => '');

type RuleContext = TSESLint.RuleContext<'commentTooLong', never[]>;
type SourceCode = TSESLint.SourceCode;
type Comment = TSESTree.Comment;
type RuleListener = TSESLint.RuleListener;

interface MessageIds {
  readonly commentTooLong: 'commentTooLong';
}

interface CommentData {
  readonly actualLength: number;
  readonly maxLength: number;
  readonly overBy: number;
}

const MAX_COMMENT_LENGTH = 80;

/**
 * Checks if a comment line contains an ESLint disable directive.
 */
const isEslintDisableComment = ((commentContent: string): boolean => {
  const trimmed = commentContent.trim();

  return (trimmed.includes('eslint-disable') || trimmed.includes('eslint-disable-next-line'));
});

const isTsComment = ((commentContent: string): boolean => {
  const trimmed = commentContent.trim();

  return (trimmed.includes('@ts-expect-error') || trimmed.includes('@ts-ignore'));
});

/**
 * Gets the actual comment content for a given line, excluding surrounding code.
 */
const getCommentContentForLine = ((
  comment: Comment,
  lineNumber: number,
  sourceCode: SourceCode
): (string | null) => {
  const lineIndex = (lineNumber - 1);
  const lineText = sourceCode.lines[lineIndex];

  if(!lineText) {
    return null;
  }

  if(comment.type === AST_TOKEN_TYPES.Line) {
    // For line comments, the entire comment is on one line.
    if(lineNumber === comment.loc.start.line) {
      return lineText.slice(comment.loc.start.column);
    }

    return null;
  } else if(comment.type === AST_TOKEN_TYPES.Block) {
    const isFirstLine = (lineNumber === comment.loc.start.line);
    const isLastLine = (lineNumber === comment.loc.end.line);

    if(isFirstLine && isLastLine) {
      // Single-line block comment.
      return lineText.slice(comment.loc.start.column, comment.loc.end.column);
    } else if(isFirstLine) {
      // First line of multi-line block comment.
      return lineText.slice(comment.loc.start.column);
    } else if(isLastLine) {
      // Last line of multi-line block comment.
      return lineText.slice(0, comment.loc.end.column);
    }
    // Middle line of multi-line block comment.
    return lineText;
  }

  return null;
});

/**
 * Checks each line of a comment for length violations.
 */
const checkCommentLines = ((
  comment: Comment,
  sourceCode: SourceCode
): (readonly {
  line: number;
  actualLength: number;
  overBy: number;
}[]) => {
  const violations: {line: number;
    actualLength: number;
    overBy: number;}[] = [];
  const startLine: number = comment.loc.start.line;
  const endLine: number = comment.loc.end.line;

  for(let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
    const commentContent = getCommentContentForLine(comment, lineNumber, sourceCode);

    if(commentContent && (commentContent.length > MAX_COMMENT_LENGTH)) {
      // Skip ESLint disable comments
      if(isEslintDisableComment(commentContent) || isTsComment(commentContent) || (commentContent.includes('* '))) {
        continue;
      }

      const overBy: number = (commentContent.length - MAX_COMMENT_LENGTH);
      violations.push({
        line: lineNumber,
        actualLength: commentContent.length,
        overBy: overBy
      });
    }
  }
  return violations;
});

/**
 * Creates a data object for the error message.
 */
const createCommentData = ((
  actualLength: number,
  overBy: number
): CommentData => ({
  actualLength: actualLength,
  maxLength: MAX_COMMENT_LENGTH,
  overBy: overBy
}));

export default createRule<never[], (keyof MessageIds)>({
  name: 'comment-length-limit',
  meta: {
    type: 'layout',
    docs: {description: 'Enforce that comments do not exceed column 80'},
    schema: [],
    messages: ({commentTooLong: 'Comment extends to column {{actualLength}}, exceeding the limit of {{maxLength}} by {{overBy}} characters'} as const)
  },
  defaultOptions: [],
  create: ((context: RuleContext): RuleListener => {
    const sourceCode: SourceCode = context.sourceCode;
    const handleProgram = ((_node: TSESTree.Program): void => {
      const comments: (readonly Comment[]) = sourceCode.getAllComments();
      for(const comment of comments) {
        if((comment.type === AST_TOKEN_TYPES.Line) || (comment.type === AST_TOKEN_TYPES.Block)) {
          const violations = checkCommentLines(comment, sourceCode);
          for(const violation of violations) {
            const commentData: CommentData = createCommentData(violation.actualLength, violation.overBy);
            context.report({
              loc: {
                start: {
                  line: violation.line,
                  column: MAX_COMMENT_LENGTH
                },
                end: {
                  line: violation.line,
                  column: (comment.loc.start.column + violation.actualLength)
                }
              },
              messageId: 'commentTooLong',

              data: (commentData as any)
            });
          }
        }
      }
    });
    return {Program: handleProgram};
  })
});
