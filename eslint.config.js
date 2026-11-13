const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  // Pastas que o ESLint não deve analisar.
  { ignores: ["dist/", "node_modules/", "coverage/"] },

  // Regras recomendadas para JavaScript...
  js.configs.recommended,

  // ...e para TypeScript.
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      // Ensina ao ESLint que `process`, `console`, `require` etc. existem no Node.
      globals: globals.node,
    },
  },

  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    rules: {
      // Permite parâmetros prefixados com "_" quando não são usados.
      // Exemplo: `_req` nos handlers do Express.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  {
    // O projeto é CommonJS: o próprio arquivo de configuração usa `require`.
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Sempre por último: desliga regras de estilo que conflitam com o Prettier.
  prettier,
);
