# PRD – API Educativa Node.js + TypeScript com CI/CD na Render

**Autor:** Marcos · **Versão:** 1.0 · **Status:** Rascunho para execução pelo agente

## 1. Visão geral

Projeto **educativo** que guia, passo a passo, a criação de uma API REST em **Node.js com TypeScript**, desde os fundamentos até o deploy em produção. A API é propositalmente simples: possui **4 endpoints** (GET, POST, PUT e DELETE) que, por enquanto, **não se conectam a nenhum banco de dados** e apenas retornam um JSON com `ok`.

O foco não é a complexidade da API, e sim o **processo completo de engenharia**: configurar o projeto, construir, testar, automatizar com CI/CD e publicar.

### 1.1 Fonte de verdade das fases: a pasta `/docs`

> **Regra permanente para o agente de código:** o agente deve **sempre consultar os documentos dentro da pasta `/docs`** do projeto antes de implementar qualquer coisa. É nessa pasta que as fases a serem implementadas estão descritas, **em ordem sequencial**.

Na prática, isso significa:

- **Ler antes de agir:** ao iniciar a sessão e no começo de cada fase, listar e ler os arquivos de `/docs` para saber o que vem agora e o que já foi concluído.
- **Seguir a sequência:** as fases são numeradas e devem ser executadas na ordem em que aparecem em `/docs`. Não pular etapas nem adiantar fases futuras.
- **Uma fase por vez:** concluir, validar e confirmar o resultado de uma fase antes de abrir a próxima, conforme a seção 15.
- **Relação com este PRD:** o `AGENTS.md` define **escopo, requisitos e critérios de aceite**; a pasta `/docs` detalha **as fases de implementação**. Se os dois divergirem, ou se faltar algum documento de fase, **perguntar ao Marcos antes de assumir** — nunca inventar o conteúdo de uma fase.

## 2. Objetivo

Ao final do projeto, deve existir:

- Uma API em TypeScript funcionando localmente, com testes automatizados.
- Um repositório no GitHub com pipelines de CI/CD (GitHub Actions).
- **Dois ambientes** hospedados na Render: **dev** e **produção**.
- Todos os 4 endpoints acessíveis publicamente nas URLs da Render, retornando `ok`.
- Um passo a passo documentado que qualquer iniciante consiga seguir.

## 3. Público-alvo

Pessoas com conhecimento básico de programação e terminal que querem aprender o ciclo completo de uma API: código, testes, integração contínua e deploy. O material deve ser **didático**: explicar o _porquê_ de cada passo, não apenas o _como_.

## 4. Escopo

### Dentro do escopo

- Configuração do projeto Node.js + TypeScript.
- API com 4 endpoints retornando JSON `ok`.
- Testes automatizados dos endpoints.
- Lint e build como etapas de qualidade.
- Pipeline de CI (testes e build) e CD (deploy) com GitHub Actions.
- Dois ambientes na Render (dev e produção).
- Documentação (README com passo a passo).
- **Postgres local via Docker Compose** (`infra/db`), apenas para desenvolvimento.

### Fora do escopo (nesta versão)

- **Persistência de dados:** a API não lê nem grava no banco; as respostas continuam fixas.
- **Banco de dados em produção:** os serviços da Render não se conectam ao Postgres.
- Autenticação e autorização.
- Validação complexa de payloads.
- **Docker para empacotar/publicar a API**, observabilidade avançada e domínio customizado.

> O Docker + PostgreSQL aparecem **somente no ambiente local** (`infra/db`) para preparar o terreno para a persistência real. Esses itens podem virar extensões futuras do curso/tutorial.

## 5. Stack

| Camada                 | Tecnologia                      |
| ---------------------- | ------------------------------- |
| Runtime                | Node.js (LTS)                   |
| Linguagem              | TypeScript                      |
| Framework HTTP         | Express                         |
| Testes                 | Vitest + Supertest              |
| Lint/Formatação        | ESLint + Prettier               |
| Dev local              | tsx ou ts-node-dev (hot reload) |
| CI/CD                  | GitHub Actions                  |
| Hospedagem             | Render (Web Service)            |
| Banco local (dev)      | PostgreSQL 15 via Docker Compose |
| Gerenciador de pacotes | npm                             |

## 6. Requisitos funcionais

A API deve expor exatamente 4 endpoints sob o recurso `items`. Todos respondem com JSON.

| Método | Rota             | Descrição            | Status | Resposta             |
| ------ | ---------------- | -------------------- | ------ | -------------------- |
| GET    | `/api/items`     | Listar (simulado)    | 200    | `{ "status": "ok" }` |
| POST   | `/api/items`     | Criar (simulado)     | 201    | `{ "status": "ok" }` |
| PUT    | `/api/items/:id` | Atualizar (simulado) | 200    | `{ "status": "ok" }` |
| DELETE | `/api/items/:id` | Remover (simulado)   | 200    | `{ "status": "ok" }` |

**Observações:**

- O “update” é implementado com o método **PUT**.
- Nenhum endpoint persiste ou lê dados; a resposta é fixa.
- Rotas inexistentes devem retornar **404** com JSON (`{ "error": "not found" }`).
- O endpoint `GET /api/items` pode ser usado como _health check_ da Render, evitando criar um quinto endpoint.

## 7. Requisitos não funcionais

- **Código limpo e comentado de forma didática**, com TypeScript em modo `strict`.
- **Porta configurável** via variável de ambiente `PORT` (a Render injeta esse valor).
- **Separação em camadas simples:** `app` (configuração do Express) separado de `server` (listen), para facilitar testes.
- **Reprodutibilidade:** `npm ci`, `npm run build` e `npm test` devem funcionar em uma máquina limpa.
- **Sem segredos no repositório:** tokens e hooks ficam em GitHub Secrets.

## 8. Estrutura sugerida do repositório

```
api-educativa/
├── src/
│   ├── app.ts                # cria e configura o Express (sem listen)
│   ├── server.ts             # sobe o servidor na porta
│   └── routes/
│       └── items.routes.ts
├── tests/
│   ├── app.test.ts
│   └── items.test.ts
├── docs/                     # fases do projeto, em ordem sequencial
│   ├── 01-criacao-inicial-da-api.md
│   └── 02-endpoints-items.md
├── infra/
│   └── db/
│       └── docker-compose.yml  # Postgres local via Docker (imagem postgres:15-alpine)
├── .github/
│   └── workflows/
│       ├── ci.yml            # lint + build + testes
│       ├── deploy-dev.yml
│       └── deploy-prod.yml
├── .env                      # variáveis locais (NÃO versionado)
├── .eslintrc / eslint.config.js
├── vitest.config.mts
├── tsconfig.json
├── package.json
└── README.md
```

**Sobre o Postgres local:** o `infra/db/docker-compose.yml` sobe um container `node_postgres_local` usando a imagem `postgres:15-alpine`, com dados persistidos no volume `pgdata` e variáveis lidas do `.env` da raiz. Para subir o banco:

```bash
npm run up:db
```

> O banco é apenas para desenvolvimento local nesta versão; a API continua sem persistência (ver seção 4).

## 9. Scripts do `package.json`

| Script  | Função                                         |
| ------- | ---------------------------------------------- |
| `dev`   | Executa em modo desenvolvimento com hot reload |
| `build` | Compila TypeScript para `dist/`                |
| `start` | Executa `node dist/server.js`                  |
| `test`  | Roda os testes com Vitest                      |
| `lint`  | Roda o ESLint                                  |
| `up:db` | Sobe o Postgres local via Docker Compose       |

## 10. Estratégia de testes

- Testes de integração dos 4 endpoints usando **Supertest** sobre o `app` (sem subir porta real).
- Para cada endpoint, verificar **status HTTP** e **corpo JSON** (`{ "status": "ok" }`).
- Teste para rota inexistente (404).
- Os testes devem rodar no CI e **bloquear o deploy** se falharem.

## 11. Ambientes, branches e CI/CD

### Ambientes

| Ambiente     | Branch    | Serviço na Render    | Finalidade                                 |
| ------------ | --------- | -------------------- | ------------------------------------------ |
| **Dev**      | `develop` | `api-educativa-dev`  | Validar mudanças antes de ir para produção |
| **Produção** | `main`    | `api-educativa-prod` | Versão estável e pública                   |

### Fluxo de trabalho

1. O desenvolvedor cria uma branch de feature a partir de `develop`.
2. Abre um **Pull Request** para `develop`; o **CI** roda lint, build e testes.
3. Após o merge em `develop`, o pipeline faz **deploy automático no ambiente dev**.
4. Quando o dev estiver validado, abre-se um PR de `develop` para `main`.
5. Após o merge em `main`, o pipeline faz **deploy automático em produção**.

### Pipelines (GitHub Actions)

- **`ci.yml`**: dispara em _pull requests_ e _push_ para `develop` e `main`. Etapas: checkout, setup do Node, `npm ci`, `npm run lint`, `npm run build`, `npm test`.
- **`deploy-dev.yml`**: dispara em _push_ para `develop`, executa depois do CI passar e aciona o **Deploy Hook** do serviço dev na Render.
- **`deploy-prod.yml`**: dispara em _push_ para `main`, executa depois do CI passar e aciona o **Deploy Hook** do serviço de produção na Render.

### Segredos e variáveis

- `RENDER_DEPLOY_HOOK_DEV` e `RENDER_DEPLOY_HOOK_PROD` armazenados em **GitHub Secrets**.
- Recomenda-se desativar o _auto-deploy_ nativo da Render para que o deploy aconteça **somente via pipeline**, após os testes passarem.
- Opcional: usar **GitHub Environments** (`dev` e `production`), com aprovação manual para produção.

## 12. Configuração na Render

- Tipo: **Web Service**, runtime Node.
- Build command: `npm ci && npm run build`.
- Start command: `npm start`.
- Health check path: `/api/items`.
- Variáveis de ambiente: `NODE_ENV` (`development` no dev, `production` na produção).
- Dois serviços separados, um por branch.

## 13. Roadmap didático (passo a passo)

Cada etapa deve ser explicada antes de ser executada, com o objetivo, o comando e o resultado esperado.

1. **Fundamentos e preparação:** instalar Node.js, Git e editor; entender o que é uma API REST e o que cada método HTTP significa.
2. **Inicializar o projeto:** `npm init`, instalar TypeScript, configurar `tsconfig.json` e entender o que o compilador faz.
3. **Primeiro servidor:** criar o Express com um endpoint e rodar localmente.
4. **Implementar os 4 endpoints:** GET, POST, PUT e DELETE retornando `ok`; separar `app.ts` de `server.ts`.
5. **Testar manualmente:** usar `curl` ou um cliente HTTP (Insomnia, Postman) em cada endpoint.
6. **Testes automatizados:** configurar Vitest e Supertest e escrever os testes dos endpoints.
7. **Qualidade de código:** configurar ESLint e Prettier.
8. **Versionamento:** criar repositório no GitHub, definir as branches `develop` e `main` e fazer o primeiro push.
9. **CI:** criar `ci.yml` e ver os testes rodando em um Pull Request.
10. **Render (dev):** criar o serviço dev, configurar build e start e testar a URL.
11. **CD para dev:** criar o Deploy Hook, salvar no GitHub Secrets e criar `deploy-dev.yml`.
12. **Render e CD para produção:** repetir o processo para `main` com `deploy-prod.yml`.
13. **Validação final:** testar os 4 endpoints nas URLs públicas de dev e produção.
14. **Fechamento:** revisar o README e listar próximos passos (banco de dados, autenticação, Docker).

## 14. Critérios de aceite

- [ ] `npm run dev` sobe a API localmente.
- [ ] Os 4 endpoints retornam `{ "status": "ok" }` com os status esperados.
- [ ] `npm test` passa com todos os testes verdes.
- [ ] `npm run lint` e `npm run build` rodam sem erros.
- [ ] O CI roda automaticamente em Pull Requests e bloqueia merges com falha.
- [ ] Push em `develop` publica automaticamente no ambiente **dev** da Render.
- [ ] Push em `main` publica automaticamente no ambiente de **produção** da Render.
- [ ] Os 4 endpoints respondem corretamente nas URLs públicas dos dois ambientes.
- [ ] O README documenta todo o passo a passo.

## 15. Instruções para o agente

- **Idioma:** conduzir o tutorial, os comentários explicativos e o README em **português**; nomes de código (variáveis, funções, arquivos) em inglês.
- **Ritmo:** avançar **uma etapa do roadmap por vez**, explicando o conceito, executando e confirmando o resultado antes de seguir.
- **Didática:** explicar o motivo de cada decisão e evitar jargão sem definição.
- **Simplicidade:** não adicionar funcionalidades fora do escopo (banco, auth, Docker) a menos que o Marcos peça.
- **Verificação:** ao final de cada etapa, indicar como validar que funcionou (comando e saída esperada).
- **Segurança:** nunca colocar tokens ou URLs de Deploy Hook no código; sempre usar GitHub Secrets.
- **Dúvidas:** se algo for ambíguo, perguntar antes de assumir.
- **Skills:** ao configurar ou escrever testes, usar sempre a skill `vitest`; ao criar ou alterar código de produção, seguir a skill `test-driven-development` (teste falhando **antes** do código).

## 16. Próximos passos (pós-v1)

- Conectar a API ao PostgreSQL (já disponível localmente em `infra/db`) e adicionar persistência real.
- Validação de entrada (por exemplo, com Zod).
- Autenticação com JWT.
- Containerização com Docker.
- Logs estruturados e monitoramento.
