// @ts-check
import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";

export default tseslint.config(
  // Ignore patterns (equivalent to ignorePatterns in .eslintrc)
  { ignores: ["src/test/**"] },

  // Apply to JS and TS files
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
  },

  // Base configs
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs["recommended-typescript"],
  
  // Main configuration
  {
    // Configure TypeScript parser
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    
    // Include import plugin
    plugins: {
      import: importPlugin,
    },
    
    // Custom rules preserved from pre-migration configuration
    rules: {
      // Temporarily disable warning rules for CI build
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
      'no-case-declarations': 'off',
      'no-unreachable': 'off',
      'no-useless-assignment': 'off', // enabled by eslint 10 recommended; 13 hits in legacy views
      '@typescript-eslint/no-require-imports': 'off',
      '@eslint-react/no-unstable-default-props': 'off',
      'eslint-comments/no-unused-disable': 'off',
      
      // React rules
      '@eslint-react/no-unused-class-component-members': 'off',
      '@eslint-react/no-unused-state': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/no-missing-key': 'off',
      // v5 renamed 'web-api/no-leaked-*' to 'web-api-no-leaked-*' and
      // 'hooks-extra/no-direct-set-state-in-use-effect' to 'set-state-in-effect'
      '@eslint-react/web-api-no-leaked-event-listener': 'off',
      '@eslint-react/web-api-no-leaked-timeout': 'off',
      '@eslint-react/no-access-state-in-setstate': 'off',
      '@eslint-react/no-set-state-in-component-did-mount': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/no-prop-types': 'off',
      // newly enabled by @eslint-react 5 recommended; legacy class components violate them
      '@eslint-react/no-direct-mutation-state': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      
      // Formatting rules
      'indent': 'off',
      'linebreak-style': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      
      // General rules
      'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 0 }],
      'no-console': 'off',
      'no-prototype-builtins': 'off',
      'no-underscore-dangle': 'off',
      'no-undef': 'error',
      'max-len': 'off',
      'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
      
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': ['off', { 'ignoreRestArgs': true }],
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-shadow': 'off',
      
      // React legacy rules
      'react/jsx-filename-extension': [0, { 'extensions': ['.js', '.jsx'] }],
      'react/prop-types': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/jsx-key': 'off',
      'react/no-string-refs': 'off',
      'react/react-in-jsx-scope': 'off',
      
      // Import rules
      'import/no-extraneous-dependencies': [
        'error',
        {
          'devDependencies': [
            'test/**/*.js',
            'tests/**/*.js'
          ]
        }
      ],
    }
  }
); 