# Epic 01 — Fundação da API, qualidade e entrega contínua em dois ambientes

**Sprint:** 01 · **Período:** 31/10/2026 a 24/11/2026 · **Status:** ✅ Concluído

**Repositório:** [MarcosPrintes/engenhariasoftware_backend](https://github.com/MarcosPrintes/engenhariasoftware_backend)

---

## 1. Resumo executivo

Este épico entregou a base completa do projeto educativo: uma API REST em **Node.js + TypeScript** com os **4 endpoints** do PRD, testes automatizados, ferramentas de qualidade (ESLint + Prettier), pipeline de **CI/CD no GitHub Actions** e **dois ambientes publicados na Render** (`dev` e produção).

Nenhum endpoint persiste dados — todas as respostas são fixas, conforme o escopo da v1. O PostgreSQL existe apenas como serviço local em Docker Compose, preparado para uma extensão futura.

Ao final do épico, o fluxo completo funcionava de ponta a ponta:

```text
feature/*  →  PR  →  develop  →  deploy dev  →  validação  →  PR  →  main  →  deploy produção
                         │                                              │
                         └──────────── CI: lint + build + test ─────────┘
```

---

## 2. Objetivo do épico

Sair de um diretório vazio e chegar a uma API pública, testada, versionada e publicada automaticamente em dois ambientes — documentando o **porquê** de cada decisão, não apenas o **como**.

O épico cobre os passos 1 a 14 do roadmap didático do PRD:

| Passo do roadmap | Entrega | Status |
| ---------------- | ------- | ------ |
| 1–2 | Fundamentos, projeto Node + TypeScript | ✅ |
| 3 | Primeiro servidor Express | ✅ |
| 4 | 4 endpoints com `app` separado de `server` | ✅ |
| 5 | Teste manual com `curl` | ✅ |
| 6 | Testes automatizados com Vitest + Supertest | ✅ |
| 7 | ESLint + Prettier | ✅ |
| 8 | Versionamento, branches `develop` e `main` | ✅ |
| 9 | CI no GitHub Actions | ✅ |
| 10 | Render — ambiente dev | ✅ |
| 11 | CD para dev (Deploy Hook) | ✅ |
| 12 | Render + CD para produção | ✅ |
| 13 | Validação dos endpoints públicos | ✅ |
| 14 | README e próximos passos | ✅ |

---

## 3. Escopo entregue

| Área | Entrega |
| ---- | ------- |
| **API** | 4 endpoints sob `/api/items` + tratador de 404 em JSON |
| **Arquitetura** | Separação `app` (configuração) / `server` (listen) / `routes` (recurso) |
| **Testes** | 5 testes de integração com Vitest + Supertest (2 arquivos) |
| **Qualidade** | ESLint 10 (flat config) + Prettier 3 + scripts de lint/format |
| **Build** | `tsc` em modo `strict`, saída em `dist/` |
| **CI/CD** | Pipeline único (`pipeline.yml`) com 3 jobs: testes, deploy dev, deploy prod |
| **Ambientes** | Render `development` (branch `develop`) e `production` (branch `main`) |
| **Infra local** | PostgreSQL 15 via Docker Compose (`infra/db`) |
| **Documentação** | `docs/01`–`03`, `README.md` e governança no `AGENTS.md` |
| **Governança** | `develop` protegida: PR obrigatório + check "Build e testes" |

---

## 4. Entregas detalhadas

### 4.1 Fase 01 — Criação inicial da API

**Documento:** [`history_01-criacao-inicial-da-api.md`](./history_01-criacao-inicial-da-api.md) · **Concluída em 31/10/2026**

**Objetivo:** provar que o ambiente (Node, npm, TypeScript) funciona, com um servidor HTTP na porta 3000 respondendo `ok`.

**O que foi construído:**

| Arquivo | Papel |
| ------- | ----- |
| `package.json` | Dependências e scripts (`dev`, `build`, `start`, `test`) |
| `tsconfig.json` | TypeScript em `strict`, `target` ES2022, `commonjs`, `src/` → `dist/` |
| `src/app.ts` | Cria e configura o Express — **sem** `app.listen` |
| `src/server.ts` | Lê `PORT` (padrão 3000) e sobe o servidor |
| `.gitignore` | Ignora `node_modules/`, `dist/`, `.env` |

**Decisões registradas:**

1. **Separar `app` de `server`.** O Supertest usa o `app` diretamente, sem abrir porta real. Se a configuração estivesse presa no `server.ts`, os testes da fase seguinte seriam impossíveis sem subir um servidor de verdade.
2. **Porta via `process.env.PORT`.** A Render injeta essa variável; localmente o fallback é 3000.
3. **404 em JSON.** Rota inexistente devolve `{ "error": "not found" }`, nunca o HTML de erro padrão do Express. O middleware fica registrado por último.

**Evidências:** `npm run dev` + `curl` → `200 {"status":"ok"}`; rota inexistente → `404 {"error":"not found"}`; `npm run build` + `npm start` funcionando a partir de `dist/`; `PORT=4123` respeitado.

---

### 4.2 Fase 02 — Endpoints `/api/items`

**Documento:** [`history_02-endpoints-items.md`](./history_02-endpoints-items.md) · **Concluída em 31/10/2026**

**Objetivo:** expor os 4 endpoints do PRD com status HTTP corretos e resposta fixa, movendo as rotas para um arquivo próprio.

**Contrato final da API:**

| Método | Rota | Status | Corpo | Semântica |
| ------ | ---- | ------ | ----- | --------- |
| `GET` | `/api/items` | `200` | `{ "status": "ok" }` | Listar (simulado) |
| `POST` | `/api/items` | `201` | `{ "status": "ok" }` | Criar (simulado) |
| `PUT` | `/api/items/:id` | `200` | `{ "status": "ok" }` | Atualizar (simulado) |
| `DELETE` | `/api/items/:id` | `200` | `{ "status": "ok" }` | Remover (simulado) |
| qualquer | rota inexistente | `404` | `{ "error": "not found" }` | Fallback JSON |

**O que foi construído:**

- `src/routes/items.routes.ts` com um `Router` do Express;
- `src/app.ts` monta o router em `/api/items`;
- `tests/items.test.ts` com 4 testes de integração;
- `tests/app.test.ts` mantém apenas o teste de 404;
- a rota temporária `GET /` foi removida — o PRD pede exatamente 4 endpoints e usa `GET /api/items` como health check da Render.

**TDD aplicado:** primeiro os testes (RED — 4 falhas `expected 404 to be 200/201`), depois as rotas (GREEN), depois refatoração. O registro do vermelho está documentado na fase. Os testes verificam **status**, **`Content-Type`** e **corpo exato**.

**Decisões registradas:**

- `POST` responde **`201 Created`**, não `200`.
- Atualização com **`PUT`** (substituição), conforme o PRD — não `PATCH`.
- Respostas fixas: persistência é extensão pós-v1.
- O teste de 404 protege um requisito do PRD e não foi removido.

**Evidências:** `npm test` → 2 arquivos, **5 testes** verdes; `npm run build` sem erros e `dist/` sem testes; `curl` validado em `PORT=3111` para os 5 casos.

---

### 4.3 Fase 03 — Qualidade de código (ESLint + Prettier)

**Documento:** [`history_03-qualidade-de-codigo.md`](./history_03-qualidade-de-codigo.md) · **Concluída em 12/11/2026**

**Objetivo:** padronizar o código e incluir o lint no pipeline, sem alterar comportamento da API.

**O que foi construído:**

| Arquivo / comando | Função |
| ----------------- | ------ |
| `eslint.config.js` | Flat config com `@eslint/js`, `typescript-eslint` e `globals.node` |
| `.prettierrc.json` | Regras de formatação |
| `.prettierignore` | Arquivos fora do Prettier (`dist/`, lockfiles, etc.) |
| `npm run lint` / `lint:fix` | Verificação e correção automática |
| `npm run format` / `format:check` | Formatação e verificação sem alterar arquivos |
| `pipeline.yml` | Passou a rodar `npm run lint` antes de `build` e `test` |

**Decisões registradas:**

1. **Aliases de TypeScript.** O build usa TypeScript 7 (`@typescript/native`), mas o `typescript-eslint` da época não suportava TS 7. A solução foi manter `typescript@npm:@typescript/typescript6` para a API do lint e o alias nativo para o build — sem `--legacy-peer-deps`.
2. **`eslint-config-prettier` por último** na configuração, para desligar regras de estilo que conflitam com o Prettier.
3. **`_req` permitido** via `argsIgnorePattern: "^_"`, porque handlers do Express podem ignorar a requisição.
4. **Sem TDD nesta fase:** não há comportamento novo, apenas configuração. A validação é o próprio comando de lint e a suíte de 5 testes continuando verde.

**Evidências:** `npm run lint` exit `0`; teste negativo com variável não usada falhou com `@typescript-eslint/no-unused-vars`; `npm run format:check` passou; 5 testes verdes; build com TS `7.0.2`; PR #7 com job "Build e testes" verde.

**Versões:** ESLint `10.14.0`, `typescript-eslint` `8.72.2`, `@eslint/js` `10.0.1`, Prettier `3.10.1`, `eslint-config-prettier` `10.1.8`, `globals` `17.14.0`.

---

### 4.4 CI/CD com GitHub Actions

**Arquivo:** `.github/workflows/pipeline.yml`

**Gatilhos:** `pull_request` e `push` para `develop` e `main`, com `concurrency` para cancelar execuções antigas do mesmo ref.

| Job | Quando roda | O que faz |
| --- | ----------- | --------- |
| `Build e testes` | Todo PR/push em `develop` ou `main` | `npm ci` → `npm run lint` → `npm run build` → `npm test` |
| `Deploy (development)` | Push em `develop` | Aciona o Deploy Hook do serviço dev |
| `Deploy (production)` | Push em `main` | Aciona o Deploy Hook do serviço de produção |

Os jobs de deploy usam `needs: test`: **se lint, build ou teste falharem, o deploy não acontece**.

**Detalhes operacionais:**

- Node 24 no CI, com cache de npm.
- Um secret por GitHub Environment: `RENDER_DEPLOY_HOOK_URL` (em `development` e em `production`). Nenhum hook é versionado.
- Auto-deploy nativo da Render desativado — o deploy só ocorre via pipeline, depois dos testes.
- A branch `develop` exige PR e o check **"Build e testes"** aprovado. Push direto é rejeitado (regra comprovada na prática no PR #10).

---

### 4.5 Ambientes na Render

Dois Web Services Node, um por branch:

| Ambiente | Branch | Serviço | `NODE_ENV` |
| -------- | ------ | ------- | ---------- |
| **Dev** | `develop` | `api-educativa-dev` | `development` |
| **Produção** | `main` | `api-educativa-prod` | `production` |

Configuração comum:

| Item | Valor |
| ---- | ----- |
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/items` |

O health check reaproveita `GET /api/items`, evitando criar um quinto endpoint fora do contrato do PRD.

---

### 4.6 PostgreSQL local (apenas desenvolvimento)

**Arquivo:** `infra/db/docker-compose.yml` · **Script:** `npm run up:db`

| Item | Valor |
| ---- | ----- |
| Imagem | `postgres:15-alpine` |
| Container | `node_postgres_local` |
| Volume | `pgdata` (persistência entre reinícios) |
| Porta | `${POSTGRES_PORT:-5432}` |
| Variáveis | lidas do `.env` da raiz via `env_file` |

**Importante:** a API **não** se conecta a esse banco nesta versão. O serviço existe para preparar a extensão de persistência e para permitir praticar Docker Compose localmente. Os serviços da Render não usam PostgreSQL.

---

### 4.7 Documentação e governança

- **`README.md`** — visão geral, stack, estrutura, instalação, endpoints, testes, qualidade, Postgres local, CI/CD, Render, fluxo de contribuição, problemas comuns e próximos passos.
- **`docs/01`–`03`** — fases sequenciais com objetivo, passos, critérios de conclusão e evidências de verificação.
- **`AGENTS.md`** — PRD e regra permanente: `/docs` é a fonte de verdade das fases; nenhuma fase deve ser inventada; uma fase por vez.
- **Critérios de aceite do PRD (seção 14)** — os 9 itens marcados como concluídos.

---

## 5. Arquitetura e estrutura final

```text
api_cicd_ambientes/
├── src/
│   ├── app.ts                  # configura o Express (sem listen)
│   ├── server.ts               # sobe o servidor em PORT || 3000
│   └── routes/
│       └── items.routes.ts     # 4 endpoints sob /api/items
├── tests/
│   ├── app.test.ts             # 404 em JSON
│   └── items.test.ts           # 4 endpoints (status, content-type, corpo)
├── docs/
│   └── sprint01/
│       ├── history_01-criacao-inicial-da-api.md
│       ├── history_02-endpoints-items.md
│       ├── history_03-qualidade-de-codigo.md
│       └── epic01.md           # este documento
├── infra/
│   └── db/
│       └── docker-compose.yml  # PostgreSQL 15 local
├── .github/
│   └── workflows/
│       └── pipeline.yml        # testes + deploy dev + deploy prod
├── eslint.config.js
├── .prettierrc.json / .prettierignore
├── vitest.config.mts
├── tsconfig.json
├── package.json
├── README.md
└── AGENTS.md
```

**Camadas e responsabilidades:**

| Camada | Arquivo | Responsabilidade |
| ------ | ------- | ---------------- |
| Configuração HTTP | `src/app.ts` | Middlewares, montagem de rotas, fallback 404 |
| Bootstrap | `src/server.ts` | Porta e `listen` |
| Recurso | `src/routes/items.routes.ts` | Rotas de `items` e respostas |
| Testes | `tests/*.test.ts` | Integração com Supertest sobre o `app` |
| Infra local | `infra/db/docker-compose.yml` | PostgreSQL de desenvolvimento |

---

## 6. Stack e versões verificadas

| Camada | Tecnologia | Versão verificada |
| ------ | ---------- | ----------------- |
| Runtime | Node.js | `24.20.0` |
| Gerenciador | npm | `11.19.0` |
| Linguagem | TypeScript (build) | `7.0.2` |
| Linguagem | TypeScript (API do lint) | `6.0.3` via alias |
| Framework HTTP | Express | `5.3.0` |
| Testes | Vitest | `5.0.5` |
| Testes HTTP | Supertest | `7.3.1` |
| Dev local | tsx | `4.23.15` |
| Lint | ESLint | `10.14.0` |
| Lint TS | typescript-eslint | `8.72.2` |
| Formatação | Prettier | `3.10.1` |
| CI/CD | GitHub Actions | — |
| Hospedagem | Render (Web Service) | — |
| Banco local | PostgreSQL | `15-alpine` |

---

## 7. Scripts disponíveis

| Script | Função |
| ------ | ------ |
| `npm run dev` | Hot reload com `tsx watch` |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa `dist/server.js` |
| `npm test` | Vitest em modo `run` |
| `npm run test:watch` | Vitest em modo watch |
| `npm run lint` | ESLint em todo o projeto |
| `npm run lint:fix` | ESLint com correção automática |
| `npm run format` | Prettier em todo o projeto |
| `npm run format:check` | Verifica formatação sem alterar |
| `npm run up:db` | Sobe o PostgreSQL local via Docker Compose |

---

## 8. Estratégia de testes

- **Integração**, não unitários: o Supertest chama o `app` do Express sem abrir porta.
- **5 testes** em 2 arquivos:
  - 4 dos endpoints (`status`, `content-type` JSON e corpo exato);
  - 1 de rota inexistente (404 JSON).
- Cada fase escreveu o teste **antes** do código (TDD), com o RED registrado no documento da fase.
- Os testes rodam no CI e **bloqueiam o deploy** (`needs: test`).
- `vitest.config.mts` usa `environment: "node"` e inclui `tests/**/*.test.ts`.

---

## 9. Histórico de Pull Requests

| PR | Branch | Conteúdo | Data |
| -- | ------ | -------- | ---- |
| #1 | `ci/github-actions-pipeline` | Pipeline inicial de CI/CD | 01/11/2026 |
| #2 | `ci/github-actions-pipeline` | Ajuste do pipeline (`npm ci`) | 01/11/2026 |
| #3 | `api/creates-log-test` | Teste do fluxo de deploy | 03/11/2026 |
| #4 | `api/creates-log-test` | Ajuste de payload para exercitar o CI | 03/11/2026 |
| #5 | `chore/local-postgres-setup` | PostgreSQL local via Docker Compose | 12/11/2026 |
| #6 | `fix/post-response-contract` | Correção do POST para `{ "status": "ok" }` | 12/11/2026 |
| #7 | `chore/code-quality` | ESLint, Prettier e lint no CI | 12/11/2026 |
| #8 | `docs/readme-and-acceptance` | README + critérios de aceite | 24/11/2026 |
| #9 | `develop` → `main` | Promoção para produção (16 commits) | 24/11/2026 |
| #10 | `chore/sync-develop-with-main` | Sincronização de `develop` com `main` | 24/11/2026 |

---

## 10. Critérios de aceite do PRD

| Critério | Status |
| -------- | ------ |
| `npm run dev` sobe a API localmente | ✅ |
| 4 endpoints retornam `{ "status": "ok" }` com os status esperados | ✅ |
| `npm test` passa com todos os testes verdes | ✅ |
| `npm run lint` e `npm run build` sem erros | ✅ |
| CI roda em PRs e bloqueia merges com falha | ✅ |
| Push em `develop` publica no ambiente dev | ✅ |
| Push em `main` publica em produção | ✅ |
| Endpoints respondem nas URLs públicas dos dois ambientes | ✅ |
| README documenta o passo a passo | ✅ |

---

## 11. Fora do escopo (nesta versão)

- Persistência de dados — a API não lê nem grava no banco.
- Banco de dados em produção — os serviços da Render não usam PostgreSQL.
- Autenticação e autorização.
- Validação de payload (por exemplo, Zod).
- Docker para empacotar/publicar a API.
- Observabilidade avançada e domínio customizado.

---

## 12. Pendências e próximos passos

| Item | Situação |
| ---- | -------- |
| `docs/04-*` (deploy de produção e validação final) | ⛔ Ainda não documentado — é a única fase sem documento |
| Evidência versionada das URLs públicas | ⚠️ O README usa placeholders (`sua-url-dev.onrender.com`); não há registro das URLs e saídas de `curl` de produção |
| Prisma ORM / persistência | 🔜 Extensão pós-v1; branch `api/prisma` criada, ainda sem commits |
| Validação de entrada com Zod | 🔜 Pós-v1 |
| Autenticação com JWT | 🔜 Pós-v1 |
| Cobertura de testes no CI | 🔜 Pós-v1 |
| Logs estruturados e monitoramento | 🔜 Pós-v1 |

---

## 13. Referências

- [`history_01-criacao-inicial-da-api.md`](./history_01-criacao-inicial-da-api.md)
- [`history_02-endpoints-items.md`](./history_02-endpoints-items.md)
- [`history_03-qualidade-de-codigo.md`](./history_03-qualidade-de-codigo.md)
- [`../../README.md`](../../README.md)
- [`../../AGENTS.md`](../../AGENTS.md)
- [`.github/workflows/pipeline.yml`](../../.github/workflows/pipeline.yml)
- [`infra/db/docker-compose.yml`](../../infra/db/docker-compose.yml)
