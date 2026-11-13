# API Educativa Node.js + TypeScript com CI/CD na Render

[![CI/CD](https://github.com/MarcosPrintes/engenhariasoftware_backend/actions/workflows/pipeline.yml/badge.svg?branch=develop)](https://github.com/MarcosPrintes/engenhariasoftware_backend/actions/workflows/pipeline.yml)

Projeto educativo que percorre o ciclo completo de uma API REST: configuração do projeto, implementação, testes, qualidade de código, integração contínua e deploy em dois ambientes na Render.

A API é propositalmente simples: expõe **4 endpoints** sob `/api/items` e **não persiste dados**. Todas as respostas são fixas e servem para demonstrar o processo de engenharia, não regras de negócio complexas.

> **Importante:** esta versão não se conecta a banco de dados. O PostgreSQL existe apenas no ambiente local (`infra/db`) para preparar o terreno para uma extensão futura.

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Rodando localmente](#rodando-localmente)
- [Endpoints](#endpoints)
- [Testes](#testes)
- [Qualidade de código](#qualidade-de-código)
- [PostgreSQL local](#postgresql-local)
- [CI/CD](#cicd)
- [Configuração na Render](#configuração-na-render)
- [Documentação das fases](#documentação-das-fases)
- [Fluxo de contribuição](#fluxo-de-contribuição)
- [Problemas comuns](#problemas-comuns)
- [Próximos passos](#próximos-passos)

---

## Visão geral

Ao final do projeto, existem:

- uma API em TypeScript funcionando localmente;
- testes automatizados dos 4 endpoints;
- lint e formatação como etapas de qualidade;
- pipeline de CI que roda lint, build e testes em Pull Requests;
- deploy automático no ambiente de **dev** ao fazer merge em `develop`;
- deploy automático em **produção** ao fazer merge em `main`;
- documentação das fases em [`docs/`](./docs).

O fluxo completo é:

```text
feature/*  →  PR  →  develop  →  deploy dev  →  validação  →  PR  →  main  →  deploy produção
                         │                                              │
                         └──────────── CI: lint + build + test ─────────┘
```

---

## Stack

| Camada                 | Tecnologia                       |
| ---------------------- | -------------------------------- |
| Runtime                | Node.js LTS (CI usa Node 24)     |
| Linguagem              | TypeScript (modo `strict`)       |
| Framework HTTP         | Express 5                        |
| Testes                 | Vitest + Supertest               |
| Lint/Formatação        | ESLint 10 + Prettier 3           |
| Desenvolvimento local  | tsx (hot reload)                 |
| CI/CD                  | GitHub Actions                   |
| Hospedagem             | Render (Web Service)             |
| Banco local (opcional) | PostgreSQL 15 via Docker Compose |
| Gerenciador de pacotes | npm                              |

### TypeScript 7 e a API do TypeScript 6

O projeto compila com **TypeScript 7**, mas o `typescript-eslint` ainda precisa da API JavaScript do TypeScript 6. Por isso o `package.json` usa dois aliases:

| Nome no `package.json` | Pacote instalado          | Usado por                  |
| ---------------------- | ------------------------- | -------------------------- |
| `typescript`           | `@typescript/typescript6` | `typescript-eslint` (lint) |
| `@typescript/native`   | `typescript` 7            | `tsc` (build)              |

Para conferir:

```bash
npx tsc --version                          # Version 7.x
node -p "require('typescript').version"   # 6.0.x
```

Não remova esses aliases enquanto o `typescript-eslint` não suportar a API do TypeScript 7.1+.

---

## Estrutura do projeto

```text
.
├── src/
│   ├── app.ts                 # cria e configura o Express (sem listen)
│   ├── server.ts              # sobe o servidor na porta
│   └── routes/
│       └── items.routes.ts    # rotas /api/items
├── tests/
│   ├── app.test.ts            # teste de rota inexistente (404)
│   └── items.test.ts          # testes dos 4 endpoints
├── docs/                      # fases do projeto, em ordem
│   ├── 01-criacao-inicial-da-api.md
│   ├── 02-endpoints-items.md
│   └── 03-qualidade-de-codigo.md
├── infra/
│   └── db/
│       └── docker-compose.yml # PostgreSQL local
├── .github/
│   └── workflows/
│       └── pipeline.yml       # CI + deploy dev + deploy prod
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
├── vitest.config.mts
├── tsconfig.json
├── package.json
└── README.md
```

Arquivos gerados ou locais que **não** vão para o repositório: `node_modules/`, `dist/` e `.env`.

---

## Pré-requisitos

- Node.js 20 ou superior (o CI usa Node 24)
- npm 10 ou superior
- Git
- Docker e Docker Compose (opcional, apenas para o PostgreSQL local)

Confira:

```bash
node --version
npm --version
git --version
docker --version
```

---

## Instalação

```bash
git clone https://github.com/MarcosPrintes/engenhariasoftware_backend.git
cd engenhariasoftware_backend
npm ci
```

`npm ci` instala exatamente as versões do `package-lock.json`. É o mesmo comando usado no CI e na Render, garantindo reprodutibilidade.

---

## Rodando localmente

```bash
npm run dev
```

Saída esperada:

```text
Servidor rodando em http://localhost:3000
```

A porta pode ser alterada pela variável `PORT`:

```bash
PORT=4000 npm run dev
```

Para rodar o código compilado:

```bash
npm run build
npm start
```

---

## Endpoints

| Método | Rota             | Descrição            | Status | Resposta             |
| ------ | ---------------- | -------------------- | ------ | -------------------- |
| GET    | `/api/items`     | Listar (simulado)    | `200`  | `{ "status": "ok" }` |
| POST   | `/api/items`     | Criar (simulado)     | `201`  | `{ "status": "ok" }` |
| PUT    | `/api/items/:id` | Atualizar (simulado) | `200`  | `{ "status": "ok" }` |
| DELETE | `/api/items/:id` | Remover (simulado)   | `200`  | `{ "status": "ok" }` |

Rotas inexistentes respondem `404` com JSON:

```json
{ "error": "not found" }
```

### Testando com `curl`

Com o servidor rodando em `http://localhost:3000`:

```bash
# Listar -> 200
curl -i http://localhost:3000/api/items

# Criar -> 201
curl -i -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"item"}'

# Atualizar -> 200
curl -i -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"item atualizado"}'

# Remover -> 200
curl -i -X DELETE http://localhost:3000/api/items/1

# Rota inexistente -> 404
curl -i http://localhost:3000/rota-que-nao-existe
```

O `GET /api/items` também é usado como **health check** da Render.

---

## Testes

```bash
npm test
```

Saída esperada:

```text
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

Para acompanhar em modo watch durante o desenvolvimento:

```bash
npm run test:watch
```

Os testes usam **Supertest** diretamente sobre o `app`, sem abrir uma porta real. Por isso `src/app.ts` é separado de `src/server.ts`.

---

## Qualidade de código

```bash
npm run lint          # verifica o código
npm run lint:fix      # corrige automaticamente o que for seguro
npm run format        # formata com Prettier
npm run format:check  # verifica a formatação sem alterar arquivos
```

O CI executa `npm run lint` antes do build e dos testes. Se o lint falhar, o deploy não acontece.

O Prettier ignora `dist/`, `node_modules/`, `coverage/`, arquivos de lock, `.agents/`, `docs/` e `AGENTS.md` — assim a formatação não gera diffs desnecessários em conteúdo didático.

---

## PostgreSQL local

O banco é **opcional** e serve apenas para desenvolvimento local. A API atual **não lê nem grava** nele.

Crie um `.env` na raiz (não versionado):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=api_educativa
POSTGRES_PORT=5432
```

Suba o container:

```bash
npm run up:db
```

O Compose usa a imagem `postgres:15-alpine`, o container `node_postgres_local` e o volume `pgdata`.

Para parar e remover o container:

```bash
docker compose --env-file .env --file infra/db/docker-compose.yml down
```

> O volume `pgdata` preserva os dados entre execuções. Use `down -v` apenas se quiser apagar tudo.

---

## CI/CD

O pipeline está em [`.github/workflows/pipeline.yml`](./.github/workflows/pipeline.yml) e dispara em **Pull Requests** e **push** para `develop` e `main`.

### Job `Build e testes`

Executa, nesta ordem:

```text
npm ci → npm run lint → npm run build → npm test
```

Se qualquer etapa falhar, o job falha. Como os jobs de deploy dependem dele (`needs: test`), o deploy é bloqueado.

### Job `Deploy (development)`

- Executa apenas em **push para `develop`**.
- Usa o GitHub Environment `development`.
- Aciona o Deploy Hook do serviço dev na Render.

### Job `Deploy (production)`

- Executa apenas em **push para `main`**.
- Usa o GitHub Environment `production`.
- Aciona o Deploy Hook do serviço de produção na Render.

### Proteção de branches

O branch `develop` exige:

- alterações via **Pull Request**;
- check obrigatório **"Build e testes"** aprovado.

Ou seja, push direto em `develop` é rejeitado e merges com CI vermelho não passam.

### Segredos

Cada GitHub Environment (`development` e `production`) armazena seu próprio secret **`RENDER_DEPLOY_HOOK_URL`**. Nenhum hook é versionado no código.

Para configurar: **Settings → Environments → (development ou production) → Environment secrets**.

---

## Configuração na Render

Crie **dois Web Services** do tipo Node, um por branch:

| Ambiente     | Branch    | Serviço sugerido     | `NODE_ENV`    |
| ------------ | --------- | -------------------- | ------------- |
| **Dev**      | `develop` | `api-educativa-dev`  | `development` |
| **Produção** | `main`    | `api-educativa-prod` | `production`  |

Configuração comum:

| Item              | Valor                     |
| ----------------- | ------------------------- |
| Runtime           | Node                      |
| Build command     | `npm ci && npm run build` |
| Start command     | `npm start`               |
| Health check path | `/api/items`              |

Recomenda-se **desativar o auto-deploy nativo da Render** para que a publicação aconteça somente pelo pipeline, depois de lint, build e testes passarem.

### Validando os ambientes publicados

As URLs são exibidas no painel da Render. Use-as nos comandos abaixo:

```bash
DEV_URL="https://sua-url-dev.onrender.com"
PROD_URL="https://sua-url-prod.onrender.com"

curl -i "$DEV_URL/api/items"
curl -i "$PROD_URL/api/items"
```

Esperado nos dois ambientes:

```text
HTTP/2 200
content-type: application/json; charset=utf-8

{"status":"ok"}
```

Repita para `POST`, `PUT`, `DELETE` e para uma rota inexistente (404).

---

## Documentação das fases

A pasta [`docs/`](./docs) é a **fonte de verdade** da sequência de implementação.

| Fase                                | Documento                                                             | Status          |
| ----------------------------------- | --------------------------------------------------------------------- | --------------- |
| 01 — Criação inicial da API         | [`01-criacao-inicial-da-api.md`](./docs/01-criacao-inicial-da-api.md) | ✅ Concluída    |
| 02 — Endpoints `/api/items`         | [`02-endpoints-items.md`](./docs/02-endpoints-items.md)               | ✅ Concluída    |
| 03 — Qualidade de código            | [`03-qualidade-de-codigo.md`](./docs/03-qualidade-de-codigo.md)       | ✅ Concluída    |
| 04 — Deploy de produção e validação | —                                                                     | 📝 A documentar |

Antes de implementar uma nova fase, leia os documentos existentes e siga a ordem. Se faltar algum documento, o conteúdo deve ser definido com o responsável pelo projeto — nunca inventado.

---

## Fluxo de contribuição

1. Crie uma branch a partir de `develop`:

   ```bash
   git switch develop
   git pull
   git switch -c feat/minha-alteracao
   ```

2. Faça as alterações e valide localmente:

   ```bash
   npm run lint
   npm run build
   npm test
   ```

3. Faça commits no padrão **Conventional Commits**:

   ```text
   feat(items): add new endpoint
   fix(items): correct POST response
   docs: update README
   ci: add lint step
   chore(quality): configure ESLint
   ```

4. Envie a branch e abra um Pull Request para `develop`:

   ```bash
   git push -u origin feat/minha-alteracao
   ```

5. Aguarde o check **"Build e testes"** e faça o merge.

6. Após validar o ambiente dev, abra um PR de `develop` para `main` para publicar em produção.

Nunca commite `.env`, tokens ou URLs de Deploy Hook.

---

## Problemas comuns

| Sintoma                                      | Causa provável                              | Solução                                                                     |
| -------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `EADDRINUSE: address already in use :::3000` | Outro processo usa a porta 3000             | `lsof -i :3000` e encerre o processo, ou use `PORT=4000 npm run dev`        |
| `Cannot find module 'express'`               | Dependências não instaladas                 | `npm ci`                                                                    |
| `ERESOLVE ... peer typescript <6.1.0`        | Aliases do TypeScript removidos             | Restaure `typescript` e `@typescript/native` conforme a seção de TypeScript |
| `typescript-eslint does not support TS 7.0`  | Instalação forçada com `--legacy-peer-deps` | Use os aliases; não force a resolução                                       |
| `npm run build` usa TypeScript 6             | Binário antigo do `tsc`                     | `rm -rf node_modules && npm ci` e confira `npx tsc --version`               |
| Testes passam, mas `curl` falha              | Servidor antigo em execução                 | Reinicie `npm run dev`                                                      |
| Deploy dev/prod não dispara                  | Branch errada ou secret ausente             | Confira a branch (`develop`/`main`) e o secret do Environment               |
| Health check da Render falha                 | App não lê `PORT` ou rota errada            | Confirme `process.env.PORT` e o path `/api/items`                           |
| Postgres local não sobe                      | Porta 5432 ocupada ou `.env` ausente        | Ajuste `POSTGRES_PORT` e confira o `.env`                                   |

---

## Próximos passos

Itens fora do escopo desta versão, sugeridos para evolução do projeto:

- conectar a API ao PostgreSQL local e adicionar persistência real;
- validar entrada com Zod;
- autenticação e autorização com JWT;
- containerizar a API com Docker;
- logs estruturados e monitoramento;
- documentar a Fase 04 (deploy de produção e validação final);
- adicionar cobertura de testes e relatório no CI.

---

## Licença

ISC — consulte o campo `license` do [`package.json`](./package.json).
