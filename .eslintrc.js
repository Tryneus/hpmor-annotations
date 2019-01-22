module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    'no-console': ['error', {allow: ['log', 'error']}],
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
  }
};
