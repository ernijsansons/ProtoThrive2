module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Code Quality
    'no-console': 'error',
    'no-debugger': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // Code Style
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Performance
    'no-await-in-loop': 'warn',
    'prefer-promise-reject-errors': 'error'
  },
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/']
};