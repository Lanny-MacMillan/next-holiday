import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Prevent anti-patterns in client components
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message: 'Use RTK Query/route handlers; avoid fetch in client components.',
        },
        {
          selector: "CallExpression[callee.object.name='axios']",
          message: 'Use RTK Query/route handlers; avoid axios in client components.',
        },
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: 'Do not use localStorage for canonical server data.',
        },
      ],
    },
    overrides: [
      {
        files: ['app/api/**', 'lib/server/**'],
        rules: { 'no-restricted-syntax': 'off' },
      },
    ],
  },
];

export default eslintConfig;
