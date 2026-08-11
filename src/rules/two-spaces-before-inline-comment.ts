import type {TSESLint, TSESTree} from '@typescript-eslint/utils';
import {AST_TOKEN_TYPES, ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(_ => '');

type RuleFixer = TSESLint.RuleFixer;
type RuleFix = TSESLint.RuleFix;

export default createRule({
  name: 'two-spaces-before-inline-comment',
  meta: {
    type: 'layout',
    docs: {description: 'Enforce at least two spaces before end-of-line comments'},
    fixable: 'whitespace',
    schema: [],
    messages: {twoSpacesRequired: 'End-of-line comments must be preceded by at least 2 spaces, found {{actual}}'}
  },
  defaultOptions: [],
  // eslint-disable-next-line max-lines-per-function -- Expected.
  create: ((context) => {
    const sourceCode = context.sourceCode;

    const isEndOfLineComment = ((
      comment: TSESTree.Comment,
      line: string
    ): boolean => {
      const beforeComment = line.slice(0, comment.loc.start.column);

      return (beforeComment.trim().length > 0);
    });
    const getSpaceCountBeforeComment = ((
      comment: TSESTree.Comment,
      line: string
    ): number => {
      const beforeComment = line.slice(0, comment.loc.start.column);
      const execResult = /( *)$/.exec(beforeComment);

      return (execResult?.[1] ? execResult[1].length : 0);
    });
    const getSpaceStartPos = ((
      comment: TSESTree.Comment,
      line: string
    ): number => {
      const beforeComment = line.slice(0, comment.loc.start.column);
      const trimmed = beforeComment.trimEnd();

      return trimmed.length;
    });

    return {
      // eslint-disable-next-line max-lines-per-function -- Expected.
      Program: ((_): void => {
        const comments = sourceCode.getAllComments();

        for(const comment of comments) {
          if(comment.type !== AST_TOKEN_TYPES.Line) {
            continue;
          }

          const lineIndex = (comment.loc.start.line - 1);
          const line = sourceCode.lines[lineIndex];

          if(!line) {
            continue;
          }

          if(!isEndOfLineComment(comment, line)) {
            continue;
          }

          const spaceCount = getSpaceCountBeforeComment(comment, line);

          if(spaceCount < 2) {
            const spaceStartPos = getSpaceStartPos(comment, line);

            context.report({
              loc: {
                start: {
                  line: comment.loc.start.line,
                  column: spaceStartPos
                },
                end: {
                  line: comment.loc.start.line,
                  column: comment.loc.start.column
                }
              },
              messageId: 'twoSpacesRequired',
              data: {
                actual: ((): string => {
                  if(spaceCount === 0) {
                    return 'no spaces';
                  } else if(spaceCount === 1) {
                    return '1 space';
                  }
                  return `${spaceCount.toString()} spaces`;
                })()
              },
              fix: ((fixer: RuleFixer): RuleFix => {
                const range = [
                  comment.range[0] - spaceCount,
                  comment.range[0]
                ];

                return fixer.replaceTextRange(
                  [
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Correct.
                    range[0]!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Correct.
                    range[1]!
                  ],
                  '  '
                );
              })
            });
          }
        }
      })
    };
  })
});
