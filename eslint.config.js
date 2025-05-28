// @ts-check
import eslintJs from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import tseslint from "typescript-eslint";
import * as importPlugin from "eslint-plugin-import";
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
    
    // Settings
    settings: {
      "import/resolver": "node",
    },
    
    // Custom rules preserved from pre-migration configuration
    rules: {
      // Style rules
      "indent": ["error", 4, { "SwitchCase": 1 }],
      "linebreak-style": [2, "unix"],
      "quotes": [2, "single"],
      "semi": [2, "always"],
      "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 0 }],
      "no-console": "off",
      "no-prototype-builtins": "off",
      "object-curly-spacing": ["warn", "always"],
      "no-unused-vars": ["warn", { "vars": "all", "args": "none" }],
      
      // Transitional rules (warn level)
      "no-empty": "warn",
      "no-case-declarations": "warn",
      "no-unreachable": "warn",
      "no-undef": "error",
      
      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { "vars": "all", "args": "none" }],
      "@typescript-eslint/no-explicit-any": ["off", { "ignoreRestArgs": true }],
      "@typescript-eslint/no-require-imports": "warn",
      // Note: typescript-eslint v8 removed @typescript-eslint/indent
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-shadow": "off",
      
      // React legacy rules
      "react/jsx-filename-extension": [0, { "extensions": [".js", ".jsx"] }],
      "react/prop-types": "off",
      "react/no-direct-mutation-state": "off",
      "react/jsx-key": "off",
      "react/no-string-refs": "off",
      "react/react-in-jsx-scope": "off",
      
      // React plugin transitional rules
      "@eslint-react/no-missing-key": "warn",
      "@eslint-react/no-array-index-key": "warn",
      "@eslint-react/no-access-state-in-setstate": "warn",
      "@eslint-react/no-unused-class-component-members": "warn",
      "@eslint-react/no-unused-state": "warn",
      "@eslint-react/no-unstable-default-props": "warn",
      "@eslint-react/web-api/no-leaked-event-listener": "warn",
      "@eslint-react/web-api/no-leaked-timeout": "warn",
      "@eslint-react/hooks-extra/no-direct-set-state-in-use-effect": "warn",
      "@eslint-react/no-set-state-in-component-did-mount": "warn",
      "@eslint-react/no-prop-types": "warn",
      
      // Import/module rules
      "max-len": "off",
      "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
      "no-underscore-dangle": "off",
      "import/no-extraneous-dependencies": [
        "error",
        {
          "devDependencies": [
            "**/*.test.js",
            "**/*.test.ts",
            "src/tests/**/*"
          ]
        }
      ],
      "import/prefer-default-export": "off",
      "spaced-comment": ["error", "always", { "exceptions": ["*"] }],
      "arrow-parens": ["error", "as-needed"],
      "import/extensions": [
        "error", 
        {
          "js": "never",
          "ts": "never",
          "json": "ignore"
        }
      ],
    }
  }
); 