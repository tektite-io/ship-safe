import js from '@eslint/js';
import globals from 'globals';

export default [
  // Ship Safe CLI — Node ESM
  {
    files: ['cli/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Pragmatic defaults for a CLI codebase
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // `console` is the CLI's primary output channel
      'no-console': 'off',
      // Pattern files use named exports + defaults; allow both
      'no-prototype-builtins': 'warn',
      // ESM with .js extensions in imports — let the runtime arbitrate
      'no-import-assign': 'error',
      // Prefer `const` for never-reassigned bindings; avoid `var`
      'prefer-const': 'warn',
      'no-var': 'error',
      // Catch typos that would silently break commands
      'no-undef': 'error',
      'no-unreachable': 'error',
      // Allow numeric separators, regex flags, etc.
      'no-irregular-whitespace': 'error',
    },
  },
  // Tests use node:test which exposes describe/it without imports? They DO import them.
  // Just make sure node globals are present for any test-only globals.
  {
    files: ['cli/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Ignore generated / vendored / non-CLI directories
  {
    ignores: [
      'node_modules/**',
      'webapp/**',
      'cli/.ship-safe/**',
      'docs/**',
      'snippets/**',
      'configs/**',
      '**/*.min.js',
      'GitHub Star History*/**',
    ],
  },
];
