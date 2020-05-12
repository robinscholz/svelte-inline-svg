module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  env: {
    es6: true,
    browser: true,
  },
  plugins: ['svelte3'],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  rules: {
    'no-console': !process.env.ROLLUP_WATCH ? 'warn' : 'off',
    'no-debugger': !process.env.ROLLUP_WATCH ? 'warn' : 'off',
  },
  settings: {
    // ...
  },
}
