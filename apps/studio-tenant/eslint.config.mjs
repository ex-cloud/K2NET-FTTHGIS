import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import queryPlugin from "@tanstack/eslint-plugin-query";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // File & Direktori yang diabaikan
    ignores: [
      "dist/**",
      "node_modules/**",
      ".turbo/**",
      "coverage/**",
      "public/**",        // vendor assets: sw.js, workbox, fonts, icons
      "routeTree.gen.ts", // TanStack Router generated file
      "**/*.d.ts",
      "*.config.*",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react": reactPlugin,
      "@tanstack/query": queryPlugin,
    },
    rules: {
      // ----------------------------------------------------
      // 1. REACT & HOOKS (Lifecycle, Re-render & Security)
      // ----------------------------------------------------
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-target-blank": "error",
      "react/self-closing-comp": ["warn", { component: true, html: true }],

      // ----------------------------------------------------
      // 2. TYPESCRIPT & BUNDLE OPTIMIZATION
      // ----------------------------------------------------
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ----------------------------------------------------
      // 3. TANSTACK QUERY CACHE & STATE SAFETY
      // ----------------------------------------------------
      // "error" → hanya aktifkan ketika seluruh queryKey sudah diaudit & diperbaiki
      "@tanstack/query/exhaustive-deps": "warn",
      "@tanstack/query/no-rest-destructuring": "warn",

      // ----------------------------------------------------
      // 4. CODE METRICS & MODULARITY (Anti God-Component)
      // ----------------------------------------------------
      "max-lines": [
        "warn",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-lines-per-function": [
        "warn",
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-depth": ["warn", 5],
      "complexity": ["warn", 25],
      "max-params": ["warn", 6],
      "max-nested-callbacks": ["warn", 4],

      // ----------------------------------------------------
      // 5. CLEAN CODE & PRODUCTION HYGIENE
      // ----------------------------------------------------
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-empty": "warn",           // catch blocks kadang sengaja kosong
      "no-useless-escape": "warn",  // regex escape lebih aman sebagai warn
      "prefer-const": "warn",
      "no-duplicate-imports": "warn", // refactor bertahap ke single import per module
    },
  }
);
