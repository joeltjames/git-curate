import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'bin/**', 'coverage/**'],
  },
  {
    extends: [
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...tseslint.configs.nodeGlobals,
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
    },
  }
);