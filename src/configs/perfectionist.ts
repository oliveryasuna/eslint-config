import type {OptionsPerfectionist} from '../options';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {loadPlugin} from '../interop';
import {applySeverity} from '../options';

/**
 * Group names use perfectionist's `<modifier>-<selector>` spelling, which is
 * validated against the plugin's selector list at rule-creation time — a stale
 * name is a hard error, not a silently ignored group. There is no `object`
 * selector for imports, so the group that once held it is gone.
 */
const SORT_GROUPS: Array<[string, ...string[]]> = [
  [
    'type-builtin',
    'type'
  ],
  [
    'builtin',
    'external'
  ],
  [
    'type-internal',
    'internal'
  ],
  [
    'type-parent',
    'parent',
    'type-sibling',
    'sibling',
    'type-index',
    'index'
  ],
  ['unknown']
];

const perfectionist = (async(
  {
    name,
    severity,
    files,
    overrides,
    level = 'warn'
  }: (OptionsPerfectionist & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('eslint-plugin-perfectionist', 'perfectionist'));

  return [
    {
      name: name('perfectionist', 'rules'),
      ...(files ? {files: files} : {}),
      plugins: {perfectionist: plugin},
      rules: applySeverity(
        severity,
        {
          'perfectionist/sort-exports': [
            level,
            {
              order: 'asc',
              type: 'natural'
            }
          ],
          'perfectionist/sort-imports': [
            level,
            {
              groups: SORT_GROUPS,
              newlinesBetween: 'ignore',
              order: 'asc',
              type: 'natural'
            }
          ],
          'perfectionist/sort-named-imports': [
            level,
            {
              order: 'asc',
              type: 'natural'
            }
          ],

          ...overrides
        }
      )
    }
  ];
});

export {
  perfectionist,
  SORT_GROUPS
};
