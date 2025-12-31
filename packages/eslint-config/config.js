import antfu from '@antfu/eslint-config'

export const workspaceEslintConfig = antfu(
  {
    stylistic: {
      indent: 2,
    },
    markdown: false,
    formatters: true,
    overrides: {
      vue: {
        'vue/max-attributes-per-line': ['warn', {
          singleline: { max: 2 },
          multiline: { max: 1 },
        }],
      },
    },
  },
  {
    rules: {
      'curly': 'off',
      'no-console': 'off',
      'antfu/new-line': 'off',
      'style/brace-style': ['error', '1tbs'],
      'ts/consistent-type-definitions': 'off',
      'ts/method-signature-style': 'off',
    },
  },
)
