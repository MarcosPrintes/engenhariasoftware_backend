import { defineConfig } from "vitest/config";

// Configuração do Vitest: o "motor" que roda os testes automatizados.
// Cada opção está explicada abaixo para quem está começando.
export default defineConfig({
  test: {
    // Testes de API não precisam de DOM: rodamos no mesmo ambiente do Node.
    environment: "node",

    // O Vitest procura arquivos *.test.ts dentro de tests/.
    include: ["tests/**/*.test.ts"],
  },
});
