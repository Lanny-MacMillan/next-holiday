import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const dataLoadingRules = [
  {
    selector:
      "CallExpression[callee.name='useEffect'] CallExpression[callee.name='fetch']",
    message:
      'Load data with RTK Query or a store thunk, not fetch inside useEffect.',
  },
  {
    selector: "CallExpression[callee.object.name='axios']",
    message: 'Use RTK Query or a store thunk instead of axios.',
  },
];

const eslintConfig = [
  { ignores: ['src/generated/**', '.next/**', 'coverage/**', 'node_modules/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Existing debt: surfaced as warnings so CI only fails on new real errors
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    // Client code gets its data from RTK Query and the store, not ad-hoc requests
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/app/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
    ],
    ignores: ['src/app/api/**'],
    rules: {
      'no-restricted-syntax': ['error', ...dataLoadingRules],
      'no-restricted-properties': [
        'error',
        {
          object: 'localStorage',
          message:
            'Do not use localStorage for server data. UI preferences live in the store.',
        },
      ],
    },
  },
  {
    // Existing loads that fetch inside useEffect. Move each to RTK Query or a
    // store thunk, then remove it from this list.
    files: [
      'src/app/settings/page.tsx',
      'src/components/HomePageWrapper.tsx',
      'src/components/UserSetupHandler.tsx',
      'src/hooks/useFormModalMutation.ts',
    ],
    rules: { 'no-restricted-syntax': ['warn', ...dataLoadingRules] },
  },
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      'jest-mocks/**',
      'jest.setup.js',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-properties': 'off',
    },
  },
];

export default eslintConfig;
