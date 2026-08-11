import type {StylisticOptions} from '../options/types';
import type {ModuleContext, TypedFlatConfigItem} from '../types';
import {configRules, loadPlugin} from '../interop/lazy';
import {applySeverity} from '../options/severity';

// eslint-disable-next-line max-lines-per-function -- Expected.
const stylistic = (async(
  {
    name,
    severity
  }: (StylisticOptions & ModuleContext)
): Promise<TypedFlatConfigItem[]> => {
  const plugin = (await loadPlugin('@stylistic/eslint-plugin', 'stylistic'));

  return [
    {
      name: name('stylistic', 'setup'),
      plugins: {'@stylistic': plugin}
    },
    {
      name: name('stylistic', 'rules'),
      rules: applySeverity(
        severity,
        {
          ...configRules(plugin.configs?.recommended),

          '@stylistic/array-bracket-newline': [
            'error',
            {
              minItems: 2,
              multiline: true
            }
          ],
          '@stylistic/array-element-newline': [
            'error',
            {
              minItems: 2,
              multiline: true
            }
          ],
          '@stylistic/brace-style': [
            'error',
            '1tbs'
          ],
          '@stylistic/comma-dangle': 'error',
          '@stylistic/indent': [
            'error',
            2,
            {
              SwitchCase: 1,
              offsetTernaryExpressions: true
            }
          ],
          '@stylistic/keyword-spacing': [
            'error',
            {
              before: true,
              after: true,
              overrides: {
                if: {after: false},
                catch: {after: false},
                for: {after: false},
                while: {after: false},
                switch: {after: false}
              }
            }
          ],
          '@stylistic/max-len': [
            'error',
            {
              code: 180,
              tabWidth: 2
            }
          ],
          '@stylistic/member-delimiter-style': [
            'error',
            {
              singleline: {
                delimiter: 'semi',
                requireLast: true
              },
              multiline: {
                delimiter: 'semi',
                requireLast: true
              }
            }
          ],
          '@stylistic/no-extra-parens': 'off',
          '@stylistic/no-multi-spaces': [
            'error',
            {ignoreEOLComments: true}
          ],
          '@stylistic/object-curly-newline': [
            'error',
            {
              ObjectExpression: {
                multiline: true,
                minProperties: 2
              },
              ObjectPattern: {consistent: true},
              ImportDeclaration: {multiline: true},
              ExportDeclaration: 'always'
            }
          ],
          '@stylistic/object-curly-spacing': 'error',
          '@stylistic/object-property-newline': [
            'error',
            {allowAllPropertiesOnSameLine: false}
          ],
          '@stylistic/padded-blocks': [
            'error',
            {
              blocks: 'never',
              classes: 'always',
              switches: 'never'
            }
          ],
          '@stylistic/quote-props': [
            'error',
            'as-needed'
          ],
          '@stylistic/operator-linebreak': 'off',
          '@stylistic/semi': 'error',
          '@stylistic/space-before-function-paren': [
            'error',
            'never'
          ],
          '@stylistic/spaced-comment': [
            'error',
            'always',
            {
              exceptions: [
                '==================================================',
                '--------------------------------------------------'
              ]
            }
          ]
        }
      )
    }
  ];
});

export {
  stylistic
};
