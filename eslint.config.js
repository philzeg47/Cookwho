import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "generated/**",
      "prisma/**",
      "public/**",
      "_bmad/**",
      "_bmad-output/**",
      "Archive/**",
      "docs/**",
      "src/env.js",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      // TypeScript gère la résolution des identifiants ; no-undef ferait doublon.
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Frontière de sécurité : le noyau /core doit rester pur (zéro I/O).
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "~/server",
                "~/server/*",
                "~/app",
                "~/app/*",
                "~/trpc",
                "~/trpc/*",
                "@prisma/client",
                "**/server/**",
                "**/app/**",
              ],
              message:
                "Le noyau /core doit rester pur (zéro I/O) : aucun import de /server, /app, /trpc ou Prisma.",
            },
          ],
        },
      ],
    },
  },
);
