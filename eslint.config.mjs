import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/out/**', '**/.next/**', '**/node_modules/**', '**/next-env.d.ts', '**/coverage/**', '**/playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', URL: 'readonly', fetch: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', structuredClone: 'readonly', crypto: 'readonly', performance: 'readonly', TextEncoder: 'readonly', TextDecoder: 'readonly', AbortController: 'readonly', AbortSignal: 'readonly', window: 'readonly', document: 'readonly', Worker: 'readonly', Blob: 'readonly', File: 'readonly', FileReader: 'readonly', navigator: 'readonly', HTMLElement: 'readonly', HTMLButtonElement: 'readonly', HTMLInputElement: 'readonly', HTMLDialogElement: 'readonly', Node: 'readonly', self: 'readonly' } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
);
