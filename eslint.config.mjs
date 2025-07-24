import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade no-unused-vars to warning, and allow any name
      "no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: true },
      ],

      // Escape JSX entities warning
      "react/no-unescaped-entities": "warn",

      // Warn instead of error for literal type vs const assertion
      "@typescript-eslint/prefer-as-const": "warn",

      // Warn instead of error for any
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
