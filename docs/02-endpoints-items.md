# Fase 02 — Endpoints `/api/items` (GET, POST, PUT e DELETE)

**Status:** ✅ Concluída em 31/10/2026 · **Verificada em:** 31/10/2026

**Objetivo desta fase:** expor os **4 endpoints** do PRD sob o recurso `items`, cada um respondendo o JSON fixo `{ "status": "ok" }` com o status HTTP correto, e mover essas rotas para um arquivo próprio (`src/routes/items.routes.ts`).

**O que NÃO entra nesta fase:** banco de dados, validação de payload, autenticação, lint, CI/CD e deploy. As rotas continuam **simuladas**: não leem nem gravam nada.

> Esta fase é feita com **TDD** (Test-Driven Development): primeiro escrevemos os testes, vemos todos falharem e só então implementamos as rotas. O motivo está explicado na seção [Por que testar antes](#por-que-testar-antes-tdd).

---

## Pré-requisitos

Confirme que a fase 01 está concluída:

```bash
npm test        # esperado: 2 testes passando (GET / e 404)
npm run build   # esperado: sem erros
```

Se algum falhar, resolva antes de continuar — não empilhe problemas.

---

## O contrato desta fase

| Método | Rota             | Status | Corpo               | Semântica           |
| ------ | ---------------- | ------ | ------------------- | ------------------- |
| GET    | `/api/items`     | `200`  | `{ "status": "ok" }` | Listar (simulado)   |
| POST   | `/api/items`     | `201`  | `{ "status": "ok" }` | Criar (simulado)    |
| PUT    | `/api/items/:id` | `200`  | `{ "status": "ok" }` | Atualizar (simulado)|
| DELETE | `/api/items/:id` | `200`  | `{ "status": "ok" }` | Remover (simulado)  |

Três decisões que explicam o contrato:

- **`POST` responde `201`, não `200`.** `201 Created` é a convenção HTTP para "um recurso novo foi criado". Como a criação é simulada, o status é a única parte honesta da resposta.
- **Atualização com `PUT`, não `PATCH`.** O PRD define `PUT`, que representa substituir o recurso inteiro. `PATCH` seria alteração parcial — outro conceito, fora do escopo.
- **Resposta fixa, sem banco.** `{ "status": "ok" }` prova que a rota existe e respondeu. Persistência é extensão futura (seção 16 do PRD).

### Decisões de estrutura

1. **Rotas em arquivo separado.** `app.ts` só configura o Express; `routes/items.routes.ts` define as rotas do recurso. Quando houver mais recursos, cada um ganha seu arquivo e o `app.ts` não cresce sem controle.
2. **A rota temporária `GET /` sai.** A fase 01 a criou apenas para confirmar que o servidor subia, e o próprio documento dizia que ela daria lugar aos endpoints. O PRD pede **exatamente 4 endpoints** e usa `GET /api/items` como health check da Render — não há motivo para manter `/`.
3. **O 404 continua por último.** O Express avalia middlewares **na ordem de registro**. Se o 404 viesse antes das rotas, capturaria tudo.

---

## Por que testar antes (TDD)

O ciclo tem três passos:

```
RED    → escreva um teste que falha
GREEN  → escreva o mínimo de código para passar
REFACTOR → limpe o código mantendo os testes verdes
```

**Por que não testar depois?** Porque um teste escrito depois do código já nasce passando — e um teste que nunca falhou não prova que consegue detectar um bug. Escrever antes força você a ver o vermelho e a confirmar que ele falha **pelo motivo certo** (rota inexistente), não por um erro de digitação no teste.

Nesta fase, o RED é fácil de prever: as rotas ainda não existem, então todas respondem `404` do tratador genérico.

> **Sobre a numeração do PRD:** o roadmap lista "testes automatizados" como passo 6, mas o Vitest já foi configurado antes desta fase e adotamos TDD. Ou seja, a partir daqui **cada fase escreve os testes do seu próprio comportamento antes do código**. O passo 6 do roadmap deixa de ser um marco isolado e passa a ser um hábito aplicado em todas as fases.

---

## Passo 1 (RED) — Escrever os testes

Crie `tests/items.test.ts`:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

// Supertest recebe o `app` diretamente, sem abrir porta.
// Por isso `app.ts` existe separado de `server.ts` desde a fase 01.

describe("GET /api/items", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/items", () => {
  it("responde 201 com JSON { status: 'ok' }", async () => {
    const response = await request(app)
      .post("/api/items")
      .send({ name: "item de exemplo" });

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("PUT /api/items/:id", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app)
      .put("/api/items/1")
      .send({ name: "item atualizado" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("DELETE /api/items/:id", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app).delete("/api/items/1");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});
```

Cada teste verifica **três coisas**: o status, o `Content-Type` (garante JSON) e o corpo exato. O `send(...)` simula o corpo que um cliente real enviaria — mesmo que a API ignote o conteúdo nesta fase.

### Ajustar o teste da fase 01

Como a rota `/` vai sair, remova o bloco `describe("GET /")` de `tests/app.test.ts`. O arquivo fica só com o teste de 404:

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("rota inexistente", () => {
  it("responde 404 com JSON { error: 'not found' }", async () => {
    const response = await request(app).get("/rota-que-nao-existe");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: "not found" });
  });
});
```

> **Atenção:** não apague o teste de 404. Ele protege um requisito do PRD (rota inexistente devolve JSON, nunca HTML de erro) e continua válido depois da mudança.

## Passo 2 (RED) — Rodar e ver falhar

```bash
npm test
```

Saída esperada (resumida):

```
 FAIL  tests/items.test.ts > GET /api/items > responde 200 com JSON { status: 'ok' }
AssertionError: expected 404 to be 200

 Test Files  1 failed | 1 passed (2)
      Tests  4 failed | 1 passed (5)
```

Confirme **antes de seguir**:

- as **4** falhas são dos endpoints de `items`;
- o erro é `expected 404 to be ...` — ou seja, a rota não existe;
- o teste de 404 continua **passando**.

Se a falha for outra (erro de import, sintaxe, `app` indefinido), corrija o teste até obter o vermelho esperado. Teste que falha pelo motivo errado não prova nada.

## Passo 3 (GREEN) — Implementar as rotas

Crie `src/routes/items.routes.ts`:

```ts
import { Router, type Request, type Response } from "express";

// Um Router é um "mini app": agrupa as rotas de um recurso.
// Ele é montado no app.ts sob o caminho /api/items.
// Repare que aqui os caminhos são relativos ("/", "/:id"),
// então "/" vira /api/items e "/:id" vira /api/items/:id.
export const itemsRouter = Router();

// GET /api/items — listar (simulado)
itemsRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// POST /api/items — criar (simulado)
// 201 = Created, a convenção HTTP para recurso criado.
itemsRouter.post("/", (_req: Request, res: Response) => {
  res.status(201).json({ status: "ok" });
});

// PUT /api/items/:id — atualizar (simulado)
// ":id" é um parâmetro de rota; existe para a URL ser realista,
// mas ainda não é usado porque não há banco de dados.
itemsRouter.put("/:id", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// DELETE /api/items/:id — remover (simulado)
itemsRouter.delete("/:id", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
```

Agora atualize `src/app.ts`: importe o router, monte-o em `/api/items` e **remova a rota `/`**:

```ts
import express, { type Request, type Response } from "express";

import { itemsRouter } from "./routes/items.routes";

// `app` é apenas a configuração do Express.
// Repare que NÃO existe `app.listen()` aqui: quem sobe o servidor é o server.ts.
export const app = express();

// Permite ler corpo JSON nas requisições (POST/PUT).
app.use(express.json());

// Todas as rotas de items ficam sob /api/items.
app.use("/api/items", itemsRouter);

// Rota inexistente -> 404 em JSON (nunca devolver HTML de erro).
// Fica por último: o Express avalia os middlewares na ordem de registro.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});
```

## Passo 4 (GREEN) — Rodar e ver passar

```bash
npm test
```

Saída esperada:

```
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

Se algum teste falhar, **corrija o código, não o teste**. O teste é o contrato; o código é que deve se adaptar a ele.

## Passo 5 (REFACTOR) — Limpar sem quebrar

Com tudo verde, dê uma olhada no código:

- os quatro handlers repetem `res.status(...).json({ status: "ok" })`;
- os nomes e comentários estão claros para quem nunca viu Express?

Uma refatoração possível é extrair um helper:

```ts
// Resposta padrão desta API simulada: { status: "ok" }.
// O parâmetro `statusCode` varia (200 ou 201); o corpo é sempre o mesmo.
const respondOk = (res: Response, statusCode = 200) => {
  res.status(statusCode).json({ status: "ok" });
};
```

O ganho é pequeno e o custo didático também: com quatro linhas, a repetição explícita é **mais fácil de ler** para iniciantes. Refatoração só vale quando deixa o código mais simples — se ficar mais abstrato sem ganho real, não faça. Rode `npm test` depois de qualquer mudança.

## Passo 6 — Verificar o build

```bash
npm run build
```

O `tsconfig.json` inclui apenas `src/`, então `tests/` continua fora do `dist/`. Esperado: `tsc` termina sem erros e `dist/` contém `app.js`, `server.js` e `routes/items.routes.js`.

---

## Como validar manualmente

Os testes automatizados já cobrem o contrato, mas ver com os próprios olhos ajuda a entender o HTTP. Suba o servidor:

```bash
npm run dev
```

Em outro terminal:

```bash
# 1. Listar -> 200
curl -i http://localhost:3000/api/items

# 2. Criar -> 201
curl -i -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"item"}'

# 3. Atualizar -> 200
curl -i -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"item atualizado"}'

# 4. Remover -> 200
curl -i -X DELETE http://localhost:3000/api/items/1

# 5. Rota inexistente -> 404
curl -i http://localhost:3000/api/itens

# 6. A antiga rota "/" agora também é 404
curl -i http://localhost:3000/
```

Saída esperada para o primeiro comando (trecho relevante):

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok"}
```

Nos comandos 2, 3 e 4, confira apenas o **status** e o corpo `{"status":"ok"}`. No 5 e no 6:

```
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"not found"}
```

Encerre o servidor com `Ctrl+C`.

---

## Critérios de conclusão

- [x] `GET /api/items` responde `200` com `{ "status": "ok" }`.
- [x] `POST /api/items` responde `201` com `{ "status": "ok" }`.
- [x] `PUT /api/items/:id` responde `200` com `{ "status": "ok" }`.
- [x] `DELETE /api/items/:id` responde `200` com `{ "status": "ok" }`.
- [x] Rota inexistente responde `404` com `{ "error": "not found" }`.
- [x] A rota temporária `GET /` foi removida e agora responde `404`.
- [x] `npm test` passa com **5 testes** verdes.
- [x] `npm run build` compila sem erros e `dist/` não contém os testes.
- [x] `src/app.ts` não contém `app.listen`; as rotas ficam em `src/routes/items.routes.ts`.
- [x] Os 4 endpoints foram escritos **depois** de os testes falharem (registro do RED no passo 2).

### Como foi verificado

Checagens executadas em 31/10/2026, com `dist/` apagado antes do build e o servidor compilado (`npm start`) rodando em `PORT=3111` para não conflitar com a porta 3000:

| Critério | Comando | Resultado obtido |
| -------- | ------- | ---------------- |
| 1 | `curl -i http://localhost:3111/api/items` | `200`, `Content-Type: application/json`, `{"status":"ok"}` |
| 2 | `curl -i -X POST http://localhost:3111/api/items -H "Content-Type: application/json" -d '{"name":"item"}'` | `201`, `{"status":"ok"}` |
| 3 | `curl -i -X PUT http://localhost:3111/api/items/1 -H "Content-Type: application/json" -d '{"name":"item atualizado"}'` | `200`, `{"status":"ok"}` |
| 4 | `curl -i -X DELETE http://localhost:3111/api/items/1` | `200`, `{"status":"ok"}` |
| 5 | `curl -i http://localhost:3111/api/itens` | `404`, `{"error":"not found"}` |
| 6 | `curl -i http://localhost:3111/` | `404`, `{"error":"not found"}` (rota `/` removida) |
| 7 | `npm test` | 2 arquivos, **5 testes** passando |
| 8 | `rm -rf dist && npm run build` + `find dist -type f` | `tsc` exit `0`; `app.js`, `server.js` e `routes/items.routes.js`; nenhum teste em `dist/` |
| 9 | `grep -rn "app.listen" src/` | apenas `src/server.ts` (a ocorrência em `app.ts` é comentário) |
| 10 | `npm test` no passo 2 (RED, antes do código) | **4 falhas** `expected 404 to be 200/201`; teste de 404 passando |

Checagens complementares: nenhum processo ficou preso na porta ao final; `tests/app.test.ts` mantém apenas o teste de 404, conforme instruído.

---

## Problemas comuns

| Sintoma | Causa provável |
| ------- | -------------- |
| `GET /api/items` responde `404` | Router não montado no `app.ts`, ou montado com caminho errado (`/items` em vez de `/api/items`). |
| `POST` responde `200` em vez de `201` | Faltou `res.status(201)`; sem `status()`, o Express usa `200`. |
| `:id` não chega no handler | Rota declarada como `/id` em vez de `/:id` — sem os dois-pontos o Express trata como texto literal. |
| Corpo vazio ou erro ao ler JSON | `express.json()` não está registrado, ou o `curl` não enviou `Content-Type: application/json`. |
| Testes passam, mas `curl` falha | Você está rodando o código antigo: reinicie `npm run dev` (o `tsx watch` recarrega ao salvar). |
| `Cannot find module './routes/items.routes'` | Caminho/extensão errados no import ou arquivo criado fora de `src/routes/`. |

---

## Próxima fase

Fase 03 — a ser documentada em `/docs/03-*.md`. Não avance sem o documento: a pasta `docs/` é a fonte de verdade da sequência.
