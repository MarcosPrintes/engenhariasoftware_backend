# Fase 01 — Criação inicial da API (servidor na porta 3000)

**Status:** ✅ Concluída em 31/10/2026 · **Verificada em:** 31/10/2026

**Objetivo desta fase:** ter um servidor HTTP em **Node.js + TypeScript** subindo na porta **3000** e respondendo a uma requisição. Nada além disso.

**O que NÃO entra nesta fase:** os endpoints `/api/items` (fase 04), testes automatizados (fase 06), lint (fase 07), CI/CD e deploy (fases 09–12). Aqui o foco é provar que o ambiente funciona e que o TypeScript compila e executa.

---

## Por que começar por um servidor "vazio"?

Um servidor que só responde `ok` isola as variáveis. Se algo falhar aqui, o problema é **ambiente** (Node, npm, TypeScript) — não é regra de negócio, nem banco, nem pipeline. Depurar uma coisa de cada vez é o hábito mais importante desta fase.

Também é aqui que nasce uma decisão que vai nos acompanhar até o deploy: **separar `app` de `server`**.

| Arquivo         | Responsabilidade                                                        |
| --------------- | ----------------------------------------------------------------------- |
| `src/app.ts`    | Cria e configura o Express. **Não** chama `listen`.                      |
| `src/server.ts` | Importa o `app` e sobe o servidor na porta.                              |

**Por quê?** Na fase 06 os testes vão usar o `app` diretamente com o Supertest, sem abrir porta de verdade. Se a configuração do Express estivesse presa dentro do `server.ts`, seria impossível testar sem subir um servidor real.

---

## Pré-requisitos

Confirme as versões instaladas:

```bash
node --version   # esperado: v20.x ou superior (LTS)
npm --version    # esperado: 10.x ou superior
git --version
```

Se algum comando não existir, instale antes de continuar.

---

## Passo 1 — Inicializar o projeto

```bash
npm init -y
```

Isso cria o `package.json`, o "RG" do projeto: nome, versão, scripts e dependências. O `-y` aceita os valores padrão em vez de perguntar um por um.

## Passo 2 — Instalar as dependências

Duas categorias, e a diferença importa:

```bash
# Dependências de produção: o código precisa delas para rodar
npm install express

# Dependências de desenvolvimento: só são usadas na sua máquina / no build
npm install -D typescript tsx @types/express @types/node
```

- **`express`** — framework HTTP que cuida de rotas, requisição e resposta.
- **`typescript`** — o compilador que transforma `.ts` em `.js` (o Node não executa TypeScript nativamente).
- **`tsx`** — executa TypeScript direto, com recarga automática ao salvar arquivos.
- **`@types/express` e `@types/node`** — arquivos de "tipos": ensinam ao TypeScript o formato das funções do Express e do Node. Sem eles, o editor não sabe o que é `req` e `res`.

## Passo 3 — Configurar o TypeScript

Crie o `tsconfig.json` na raiz:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

O que cada opção faz, em uma linha:

| Opção               | Efeito                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `target`            | Versão de JavaScript gerada. ES2022 é suportada pelas versões LTS.      |
| `module`            | Sistema de módulos da saída. `commonjs` é o que o Node entende nativamente. |
| `rootDir` / `outDir`| Código-fonte em `src/`, código compilado em `dist/`.                    |
| `strict`            | Liga todas as checagens rígidas. Exigido pelo PRD: pega erros cedo.     |
| `esModuleInterop`   | Permite `import express from "express"` em vez de `import * as`.        |
| `sourceMap`         | Gera `.map` para que erros apontem para a linha do `.ts`, não do `.js`. |

## Passo 4 — Criar o `app.ts`

Crie `src/app.ts`:

```ts
import express, { type Request, type Response } from "express";

// `app` é apenas a configuração do Express.
// Repare que NÃO existe `app.listen()` aqui: quem sobe o servidor é o server.ts.
export const app = express();

// Permite ler corpo JSON nas requisições (POST/PUT usados nas próximas fases).
app.use(express.json());

// Rota raiz, usada só para confirmar que o servidor está no ar.
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Rota inexistente -> 404 em JSON (nunca devolver HTML de erro).
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});
```

Detalhes didáticos:

- `_req` começa com `_` porque não é usado — é uma convenção para dizer "sei que está aqui, ignore".
- A ordem importa: o Express avalia os `app.use`/`app.get` **de cima para baixo**. O tratador de 404 fica por último, senão capturaria tudo.
- A rota `/` é temporária. Na fase 04 ela dá lugar aos endpoints `/api/items`.

## Passo 5 — Criar o `server.ts`

Crie `src/server.ts`:

```ts
import { app } from "./app";

// A Render injeta a variável PORT. Localmente ela não existe, então usamos 3000.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

**Por que ler `process.env.PORT` se agora é sempre 3000?** Porque em produção a plataforma escolhe a porta e passa por variável de ambiente. Deixar isso pronto agora evita um deploy quebrado na fase 10, e localmente o comportamento continua sendo 3000.

## Passo 6 — Adicionar os scripts

No `package.json`, substitua o bloco `"scripts"` por:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

- `dev` — roda com `tsx watch`: salvar um arquivo reinicia o servidor.
- `build` — compila `src/` para `dist/`.
- `start` — executa o JavaScript já compilado (é o comando que a Render vai usar).

## Passo 7 — Ignorar o que não vai para o repositório

Crie o `.gitignore` na raiz:

```
node_modules/
dist/
.env
```

`node_modules/` é reinstalável via `npm ci`, `dist/` é gerado pelo build e `.env` pode conter segredos.

---

## Como validar (obrigatório antes de seguir)

**1. Suba o servidor:**

```bash
npm run dev
```

Saída esperada:

```
Servidor rodando em http://localhost:3000
```

**2. Em outro terminal, faça a requisição:**

```bash
curl -i http://localhost:3000/
```

Saída esperada (trecho relevante):

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok"}
```

**3. Confirme o 404 em JSON:**

```bash
curl -i http://localhost:3000/rota-que-nao-existe
```

Saída esperada:

```
HTTP/1.1 404 Not Found

{"error":"not found"}
```

**4. Confirme que o build funciona:**

```bash
npm run build && npm start
```

Deve compilar sem erros, gerar `dist/app.js` e `dist/server.js`, e o servidor deve subir igual. Encerre com `Ctrl+C`.

---

## Critérios de conclusão

- [x] `npm run dev` sobe o servidor na porta 3000 sem erros.
- [x] `GET /` responde `200` com `{ "status": "ok" }`.
- [x] Rota inexistente responde `404` com `{ "error": "not found" }`.
- [x] `npm run build` compila sem erros e `npm start` roda o código de `dist/`.
- [x] `src/app.ts` **não** contém `listen`; apenas `src/server.ts` sobe o servidor.
- [x] `.gitignore` existe e cobre `node_modules/`, `dist/` e `.env`.

> **Nota sobre o critério do `listen`:** o único `app.listen` do projeto está em `src/server.ts`. A palavra "listen" aparece também em um **comentário explicativo** dentro do `src/app.ts` — não há chamada ali. Uma checagem automatizada por `grep` deve procurar por `app.listen`, não pela palavra solta.

### Como foi verificado

Checagens executadas em 31/10/2026, com `dist/` apagado antes do build para garantir que o artefato era novo:

| Critério | Comando | Resultado obtido |
| -------- | ------- | ---------------- |
| 1 | `npm run dev` + `curl http://localhost:3000/` | log limpo, `HTTP 200` |
| 2 | `curl -i http://localhost:3000/` | `200`, `Content-Type: application/json`, `{"status":"ok"}` |
| 3 | `curl -i http://localhost:3000/rota-que-nao-existe` | `404`, `{"error":"not found"}` |
| 4 | `rm -rf dist && npm run build && npm start` | `tsc` exit `0`; `dist/app.js` e `dist/server.js` gerados; servidor respondeu `200` |
| 5 | `grep -rn "app.listen" src/` | apenas `src/server.ts` |
| 6 | `git init` em cópia + `git status --porcelain` | `node_modules/`, `dist/` e `.env` ignorados |

Checagens complementares: `tsc --noEmit` sem erros; `PORT=4123 npm start` respeitou a variável de ambiente; `POST /api/items` retornou `404` (endpoints pertencem à fase 02); nenhum processo ficou preso na porta ao final.

**Versões instaladas nesta execução:** Node.js `v24.20.0`, npm `11.19.0`, Express `5.3.0`, TypeScript `7.0.2`, `@types/node` `26.6.6`, `tsx` `4.23.15`.


## Problemas comuns

| Sintoma                                    | Causa provável                                                    |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `EADDRINUSE: address already in use :::3000` | Outro processo já usa a porta. Rode `lsof -i :3000` e encerre-o.  |
| `Cannot find module 'express'`             | Dependências não instaladas. Rode `npm install`.                   |
| Erro de tipo em `req` / `res`              | Faltou `@types/express` ou o `tsconfig.json` não tem `strict`/`include`. |
| `SyntaxError: Cannot use import statement outside a module` | Rodou `node src/server.ts` direto. Use `npm run dev` ou `npm start`. |

## Próxima fase

Fase 02 — implementar os 4 endpoints `/api/items` (GET, POST, PUT, DELETE) retornando `{ "status": "ok" }` com os status HTTP corretos.
