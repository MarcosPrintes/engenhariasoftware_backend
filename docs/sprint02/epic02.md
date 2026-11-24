# Epic 02 — Conectar a API ao PostgreSQL com Prisma e health check

**Sprint:** 02 · **Status:** 📝 Planejado · **Depende de:** [Epic 01](../sprint01/epic01.md)

**Objetivo em uma frase:** configurar o **Prisma ORM** no projeto, conectar a API ao **PostgreSQL local** (`infra/db`) e expor `GET /health` para provar que a conexão com o banco está funcionando de verdade.

---

## 1. Contexto atual

O Epic 01 entregou a API, os testes, a qualidade e o CI/CD. O PostgreSQL local também está pronto — mas **desligado da aplicação**.

| Item | Estado hoje |
| ---- | ----------- |
| PostgreSQL 15 local | ✅ Sobe via `npm run up:db` (`infra/db/docker-compose.yml`) |
| Credenciais no `.env` | ✅ `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_URL` |
| Prisma instalado | ❌ Não |
| API conectada ao banco | ❌ Não — nenhuma dependência de banco em `package.json` |
| Endpoints `items` | ⚠️ Respondem JSON fixo `{ "status": "ok" }`, sem ler nem gravar |
| Testes | ✅ 5 testes, nenhum toca em banco |
| CI/CD | ✅ Lint + build + test; **sem** serviço de PostgreSQL |
| Ambientes Render | ⚠️ Sem banco de dados (produção continua sem persistência) |

Ou seja: **o banco existe, mas a API não sabe que ele existe.** Este épico fecha essa lacuna.

---

## 2. Objetivo

1. Instalar e configurar o **Prisma ORM** apontando para o PostgreSQL local.
2. Criar uma **instância única** do `PrismaClient` reutilizada pela aplicação.
3. Expor `GET /health` que executa um ping real no banco (`SELECT 1`) e responde conforme o resultado.
4. Preparar o terreno para a **persistência real** dos endpoints `items` (Incremento 2), sem quebrar o que já funciona no Incremento 1.

**Regra do projeto:** cada incremento deve terminar com lint, build e testes verdes, além de documentação da fase em `docs/`.

---

## 3. Escopo

### Dentro do escopo

- Adicionar o Prisma CLI (dev) e o client correspondente à versão escolhida (produção).
- Criar `prisma/schema.prisma` com `datasource postgresql` e `generator client`.
- Criar `src/lib/prisma.ts` com singleton do `PrismaClient`.
- Criar `src/routes/health.routes.ts` e montar em `/health`.
- Testes automatizados do `/health` (sucesso e falha), com o Prisma mockado.
- Scripts npm de Prisma (`prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:deploy`).
- `.env.example` versionado (sem segredos) e `.env` mantido fora do Git.
- Ajuste do CI/`npm ci` para garantir `prisma generate` antes de build e testes.
- Documentar a fase (`docs/sprint02/history_04-...`) ao final da implementação.

### Fora do escopo deste épico

- **Trocar as respostas fixas dos 4 endpoints por CRUD real** — planejado como **Incremento 2**, após validação do Incremento 1.
- Validação de payload com Zod.
- Autenticação/autorização.
- Banco de dados em produção (Render) — decisão separada (ver [seção 12](#12-impacto-em-produção-e-no-ci)).
- Seed de dados, soft delete, paginação e filtros.
- Containerizar a API.

> **Mudança de contrato consciente:** o PRD fala em "exatamente 4 endpoints". O `/health` é uma rota **operacional**, fora do recurso `items`, e passa a ser o quinto caminho da aplicação. Os 4 endpoints de `items` continuam intactos neste épico.

---

## 4. Stack atualizada

| Camada | Tecnologia | Situação |
| ------ | ---------- | -------- |
| Runtime | Node.js (LTS) | já existe |
| Linguagem | TypeScript (strict) | já existe |
| Framework HTTP | Express 5 | já existe |
| Testes | Vitest + Supertest | já existe |
| Lint/Formatação | ESLint + Prettier | já existe |
| CI/CD | GitHub Actions | já existe |
| Hospedagem | Render (Web Service) | já existe |
| Banco local (dev) | PostgreSQL 15 via Docker Compose | já existe |
| **ORM** | **Prisma** | **novo neste épico** |
| **Driver/coneção** | **Prisma Client + `DATABASE_URL`** | **novo neste épico** |

A tabela de stack do `AGENTS.md` também foi atualizada com a linha **ORM | Prisma**.

**Versão (importante):** para aplicações novas, o padrão atual é **Prisma ORM 8**. Fixe uma release 8.x publicada no `package.json` — não dependa de `latest`. O fluxo de CLI muda entre majors: o Prisma 8 usa `prisma orm init` e `prisma skills sync`, enquanto os trechos deste épico seguem a sintaxe 6/7 como **referência conceitual**. Na implementação, use as skills **`prisma-orm-setup`** (seleção de versão e conexão) e **`prisma-8`** (sintaxe exata, pacote do client e generator) antes de rodar qualquer comando.

---

## 5. Arquitetura alvo

```text
api_cicd_ambientes/
├── prisma/
│   ├── schema.prisma           # datasource postgresql + generator client
│   └── migrations/             # histórico versionado do schema
├── src/
│   ├── app.ts                  # monta /api/items, /health e o 404
│   ├── server.ts               # listen + shutdown com $disconnect()
│   ├── lib/
│   │   └── prisma.ts           # singleton do PrismaClient
│   └── routes/
│       ├── items.routes.ts     # (Incremento 2) passa a usar o Prisma
│       └── health.routes.ts    # GET /health
├── tests/
│   ├── app.test.ts             # 404
│   ├── items.test.ts           # 4 endpoints
│   └── health.test.ts          # 200 (banco up) e 503 (banco down)
├── infra/db/docker-compose.yml # PostgreSQL local (já existe)
├── .env                        # NÃO versionado
├── .env.example                # versionado, com placeholders
└── package.json                # prisma, @prisma/client e scripts
```

**Responsabilidades:**

| Arquivo | Papel |
| ------- | ----- |
| `prisma/schema.prisma` | Fonte da verdade do schema e da conexão |
| `src/lib/prisma.ts` | Uma única instância do client por processo |
| `src/routes/health.routes.ts` | Prova que a conexão com o banco responde |
| `src/server.ts` | Fecha o pool com `$disconnect()` ao encerrar |

**Por que um singleton?** O `tsx watch` recarrega o processo a cada alteração. Sem cache no `globalThis`, cada recarga abriria um novo pool de conexões até estourar o limite do PostgreSQL (`too many clients`). O singleton também evita conexões duplicadas em produção.

```ts
// src/lib/prisma.ts (esboço — sintaxe 6/7; no Prisma 8 siga o skill instalado)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 6. Variáveis de ambiente

| Variável | Onde vive | Exemplo (placeholder) |
| -------- | --------- | --------------------- |
| `POSTGRES_USER` | `.env` | `api_user` |
| `POSTGRES_PASSWORD` | `.env` | `change_me` |
| `POSTGRES_DB` | `.env` | `api_db` |
| `POSTGRES_PORT` | `.env` | `5432` |
| `DATABASE_URL` | `.env` | `postgresql://api_user:change_me@localhost:5432/api_db?schema=public` |

**Regras:**

- `DATABASE_URL` precisa usar **os mesmos valores** de `POSTGRES_*`, senão o Prisma conecta em outro banco (ou falha).
- `.env` continua no `.gitignore`.
- Criar `.env.example` **versionado** com placeholders — nunca com credenciais reais.
- No CI, `DATABASE_URL` é definida no workflow (credenciais efêmeras do serviço de teste).

---

## 7. Contrato do `GET /health`

| Cenário | Status | Corpo |
| ------- | ------ | ----- |
| Banco responde ao `SELECT 1` | `200` | `{ "status": "ok", "database": "up" }` |
| Banco indisponível / credencial errada / timeout | `503` | `{ "status": "error", "database": "down" }` |

**Regras:**

- `Content-Type: application/json` nos dois casos.
- **Não** expor mensagem de erro, host, usuário ou stack trace na resposta — detalhes vão apenas para o log do servidor.
- `Cache-Control: no-store` para não mascarar indisponibilidade.
- Timeout curto (recomendado: 2–5 s) para a rota não ficar pendurada. `$queryRaw` não tem timeout próprio: use `connect_timeout` na URL e/ou corrida com `Promise.race`.
- A rota fica **fora** de `/api/items` e é registrada antes do 404.

```ts
// src/routes/health.routes.ts (esboço)
import { Router, type Request, type Response } from "express";

import { prisma } from "../lib/prisma";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.set("Cache-Control", "no-store").status(200).json({ status: "ok", database: "up" });
  } catch {
    res.set("Cache-Control", "no-store").status(503).json({ status: "error", database: "down" });
  }
});
```

---

## 8. Modelo de dados (Incremento 2, após validar o health check)

**Proposta a confirmar com o Marcos antes de implementar:**

```prisma
model Item {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Contrato proposto para os endpoints com persistência real:**

| Método | Rota | Status | Corpo |
| ------ | ---- | ------ | ----- |
| `GET` | `/api/items` | `200` | `[ { "id": 1, "name": "...", "createdAt": "...", "updatedAt": "..." } ]` |
| `POST` | `/api/items` | `201` | item criado |
| `PUT` | `/api/items/:id` | `200` / `404` | item atualizado / `{ "error": "not found" }` |
| `DELETE` | `/api/items/:id` | `204` ou `200` | vazio / `{ "status": "ok" }` |

> ⚠️ **Isso quebra o contrato atual** (`{ "status": "ok" }` fixo), os 5 testes existentes e a tabela de requisitos do `AGENTS.md`. A mudança precisa de aprovação explícita e de um épico/fase própria. Este épico entrega apenas o Incremento 1 (Prisma + `/health`).

---

## 9. Passo a passo de implementação (Incremento 1)

### Passo 0 — Preparar o ambiente

```bash
git switch develop
git pull
git switch -c feat/prisma-health

npm run up:db          # sobe o PostgreSQL local
docker ps --filter name=node_postgres_local
```

Confirme que o container está `Up` e aceitando conexões antes de seguir.

### Passo 1 — Instalar e inicializar o Prisma

```bash
# Aplicação nova -> Prisma ORM 8 (fluxo atual)
npx prisma orm init --yes --target postgres --authoring psl

# Fluxo legado 6/7 (referência): npx prisma init --datasource-provider postgresql
```

Antes de executar, confirme a versão do CLI (`npx prisma -v`) e siga a skill `prisma-orm-setup`. O `init` cria o schema/configuração do Prisma e pode escrever `DATABASE_URL` no `.env`. **Revise**: o `.env` já tem `DATABASE_URL` e ela deve permanecer coerente com o Docker Compose — não deixe o `init` sobrescrever com valores genéricos.

### Passo 2 — Configurar o `schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Sem modelos ainda: o health check só precisa que o client exista e consiga conectar.

> **Prisma 8:** o generator e o pacote do client mudaram em relação ao 6/7. Não copie o bloco acima sem conferir a skill `prisma-8`; o `prisma orm init` já gera a configuração correta para a versão instalada.

### Passo 3 — Gerar o client e carregar a documentação da versão

```bash
npx prisma generate
npx prisma skills sync   # Prisma 8: baixa o prisma-8/SKILL.md para .agents/skills/
```

Depois do `sync`, **leia** `.agents/skills/prisma-8/SKILL.md` — sincronizar não carrega as instruções sozinho.

**Importante para o CI:** o client precisa existir antes de `tsc` e do Vitest. Adicione ao `package.json` (nomes dos scripts conforme a versão):

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio"
  }
}
```

Assim `npm ci` já gera o client, e o build da Render (`npm ci && npm run build`) continua funcionando.

### Passo 4 — Criar o singleton

Crie `src/lib/prisma.ts` conforme o esboço da [seção 5](#5-arquitetura-alvo).

### Passo 5 (TDD) — Escrever o teste antes da rota

Crie `tests/health.test.ts` **antes** da implementação:

```ts
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();

vi.mock("../src/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
}));

const { app } = await import("../src/app");

describe("GET /health", () => {
  beforeEach(() => queryRaw.mockReset());

  it("responde 200 quando o banco responde", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "up" });
  });

  it("responde 503 quando o banco falha", async () => {
    queryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "error", database: "down" });
  });
});
```

Rode `npm test` e confirme o **RED** (`/health` ainda responde 404).

### Passo 6 (GREEN) — Implementar e montar a rota

- Crie `src/routes/health.routes.ts` (esboço da [seção 7](#7-contrato-do-get-health)).
- Em `src/app.ts`, registre `app.use("/health", healthRouter)` **antes** do middleware de 404.
- Rode `npm test` até os 7 testes passarem (5 existentes + 2 novos).

### Passo 7 — Encerramento gracioso

Em `src/server.ts`, guarde o retorno de `app.listen` e feche o pool ao receber `SIGTERM`/`SIGINT`:

```ts
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`Recebido ${signal}, encerrando...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

Isso evita conexões órfãs no PostgreSQL, especialmente com hot reload.

### Passo 8 — Validação com o banco real

```bash
npm run dev
curl -i http://localhost:3000/health        # 200 {"status":"ok","database":"up"}
curl -i http://localhost:3000/api/items     # 200 {"status":"ok"} (inalterado)

docker stop node_postgres_local
curl -i http://localhost:3000/health        # 503 {"status":"error","database":"down"}
docker start node_postgres_local
curl -i http://localhost:3000/health        # volta a 200
```

### Passo 9 — Qualidade e documentação

```bash
npm run lint
npm run build
npm test
```

Depois: criar `docs/sprint02/history_04-conexao-postgres-prisma.md` com objetivo, passos, evidências e problemas comuns; atualizar o status deste épico.

---

## 10. Estratégia de testes

| Teste | Tipo | Precisa de banco? |
| ----- | ---- | ----------------- |
| `/health` → 200 | Integração com Supertest + Prisma **mockado** | Não |
| `/health` → 503 | Integração com Supertest + Prisma **mockado** | Não |
| 4 endpoints + 404 | Já existentes, não mudam | Não |
| `SELECT 1` real (opcional) | Integração real, script separado | Sim |

**Decisão recomendada:** manter o CI sem banco usando mock. A prova real da conexão fica na validação manual documentada (passo 8) e, opcionalmente, em um teste de integração isolado (`npm run test:integration`) que só roda com o Docker de pé.

**Por que mockar?** O objetivo do teste é garantir o **comportamento da rota** (200/503 e corpo), não a infraestrutura do PostgreSQL. Testar a conexão real é papel de um teste de integração explícito, para não deixar o CI lento e frágil.

---

## 11. CI/CD

### Se o mock for adotado (recomendado)

O workflow atual continua funcionando, com **uma adição**: garantir o client gerado. Com `postinstall`, `npm ci` já resolve. Alternativa explícita:

```yaml
- run: npm ci
- run: npx prisma generate
- run: npm run lint
- run: npm run build
- run: npm test
```

### Se o teste real for adotado

Adicionar um serviço PostgreSQL ao job:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: api_user
      POSTGRES_PASSWORD: api_password
      POSTGRES_DB: api_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

Com `DATABASE_URL=postgresql://api_user:api_password@localhost:5432/api_test?schema=public` e `npx prisma migrate deploy` antes dos testes.

> **Credenciais do serviço de CI são efêmeras e ficam no próprio workflow.** Nunca reutilize a senha do `.env` local.

---

## 12. Impacto em produção e no CI

O ambiente de produção da Render **não tem PostgreSQL**. Consequências:

- `/health` responderá **503** em produção enquanto não existir um banco lá.
- Por isso, **não troque** o *health check path* da Render para `/health` agora — ele marcaria o serviço como unhealthy e derrubaria o deploy. Continue usando `/api/items` até a decisão de provisionar o Render Postgres.
- O `deploy-prod` não é bloqueado por `/health`; o pipeline só valida lint/build/testes.
- Adicionar um PostgreSQL gerenciado na Render é um épico futuro (inclui migrations em produção e cuidado com credenciais).

---

## 13. Critérios de aceite (Incremento 1)

- [ ] Prisma CLI e client da versão escolhida instalados e fixados no `package.json`.
- [ ] `prisma/schema.prisma` com `provider = "postgresql"` e `url = env("DATABASE_URL")`.
- [ ] `npx prisma generate` funciona em uma máquina limpa após `npm ci`.
- [ ] `src/lib/prisma.ts` exporta uma instância única reutilizada.
- [ ] `GET /health` responde `200 { "status": "ok", "database": "up" }` com o banco de pé.
- [ ] `GET /health` responde `503 { "status": "error", "database": "down" }` com o banco parado.
- [ ] Resposta de erro não vaza detalhes internos.
- [ ] `src/server.ts` fecha o pool no shutdown (`$disconnect`).
- [ ] 7 testes verdes (5 existentes + 2 do `/health`).
- [ ] `npm run lint` e `npm run build` sem erros.
- [ ] `.env.example` versionado e `.env` fora do Git.
- [ ] `AGENTS.md`, README e `docs/` refletem a mudança.
- [ ] Nenhum dos 4 endpoints de `items` teve alteração de contrato.

---

## 14. Riscos e decisões pendentes

| Risco / decisão | Impacto | Encaminhamento |
| --------------- | ------- | -------------- |
| **Prisma × TypeScript 7** | O build usa TS 7 nativo e o lint usa a API 6 via aliases; o client gerado pode não compilar no TS 7 | Validar no primeiro build; se falhar, fixar o build em TS 6 ou aplicar workaround documentado |
| **`/health` em produção sem banco** | 503 permanente e health check da Render falhando | Manter `/api/items` como health check até provisionar o banco |
| **Teste real × mock** | Mock não prova conexão física | Mock no CI + validação manual documentada + teste de integração opcional |
| **`DATABASE_URL` divergente do Compose** | Prisma conecta no banco errado | Conferir usuário, senha, porta e database; documentar no `.env.example` |
| **Client não gerado no CI/Render** | `tsc` e Vitest falham por types ausentes | `postinstall: prisma generate` ou etapa explícita no pipeline |
| **Pool de conexões no hot reload** | `too many clients` | Singleton com cache no `globalThis` |
| **Contrato dos `items`** | Persistência real quebra os testes e o PRD atuais | Só no Incremento 2, com aprovação explícita |
| **Versão do Prisma 8** | Fluxo de CLI, pacote do client e generator diferem do 6/7; comandos copiados de tutoriais antigos quebram | Fixar 8.x, rodar `prisma skills sync` e seguir a skill `prisma-8` antes de implementar |

---

## 15. Definition of Done

1. Incremento 1 implementado com TDD e 7 testes verdes.
2. Validação manual registrada (200 com banco up, 503 com banco down).
3. Lint e build verdes; CI verde no PR.
4. `.env.example` publicado; nenhuma credencial no repositório.
5. Documento da fase em `docs/sprint02/history_04-...` com evidências.
6. Status deste épico atualizado para ✅.
7. PR aberto para `develop` e revisado.

---

## 16. Sequência sugerida de commits

```text
chore(prisma): install prisma and prisma client
feat(prisma): add prisma client singleton
test(health): add failing tests for GET /health
feat(health): add database-backed health endpoint
feat(server): disconnect prisma on shutdown
chore(env): add versioned env example
ci: generate prisma client before build
docs(phase-04): document postgres and prisma setup
```

---

## 17. Referências

- [Epic 01 — Fundação da API](../sprint01/epic01.md)
- [Fase 03 — Qualidade de código](../sprint01/history_03-qualidade-de-codigo.md)
- Skills: `prisma-orm-setup` e `prisma-8` (`.agents/skills/`)
- [`infra/db/docker-compose.yml`](../../infra/db/docker-compose.yml)
- [`src/app.ts`](../../src/app.ts) · [`src/server.ts`](../../src/server.ts)
- [`README.md`](../../README.md) · [`AGENTS.md`](../../AGENTS.md)
