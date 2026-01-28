module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React 17+ doesn't require React import
    'react/react-in-jsx-scope': 'off',
    // Allow TypeScript for prop types
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    // Unused vars with underscore prefix are allowed
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow named exports without default
    'import/prefer-default-export': 'off',
    // Allow devDependencies in config files
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
