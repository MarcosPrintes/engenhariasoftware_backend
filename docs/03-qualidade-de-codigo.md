# Fase 03 — Qualidade de código (ESLint + Prettier)

**Status:** ✅ Concluída em 12/11/2026 · **Verificada localmente e no CI em:** 12/11/2026

**Objetivo desta fase:** configurar **ESLint** e **Prettier** no projeto, expor os scripts `lint`, `lint:fix`, `format` e `format:check` e incluir o lint no pipeline de CI. O comportamento da API **não muda**: nenhum endpoint novo, nenhuma alteração de contrato.

**O que NÃO entra nesta fase:** funcionalidades novas, persistência de dados, autenticação, mudanças no deploy da Render, criação do README e documentação retroativa das entregas de CI/CD e Postgres local. Esta fase mexe apenas em ferramentas de qualidade e nos arquivos que precisarem ser formatados.

> **Contexto do repositório:** o pipeline de CI/CD (`.github/workflows/pipeline.yml`) e o Postgres local (`infra/db`) já existem no código, mas foram implementados antes de terem documentos de fase. Esta fase **não os redocumenta**; ela apenas acrescenta o lint ao pipeline existente. O alinhamento completo entre `/docs` e o repositório deve ser tratado em fases futuras, com o Marcos.

---

## Por que esta fase existe?

Até aqui o código funciona e os testes passam. Mas "funcionar" não é o mesmo que "ser consistente". Sem ferramentas de qualidade, cada pessoa escreve de um jeito: aspas simples ou duplas, ponto e vírgula ou não, variáveis declaradas e nunca usadas, imports fora de ordem. O projeto continua rodando, mas fica mais difícil de revisar e manter.

Esta fase resolve dois problemas diferentes:

| Problema | Ferramenta | Pergunta que responde |
| -------- | ---------- | --------------------- |
| Erros e más práticas no código | **ESLint** | "Este código tem algum problema que pode virar bug?" |
| Estilo e formatação | **Prettier** | "Este código está escrito no mesmo formato em todo o projeto?" |

As duas ferramentas são complementares. O ESLint analisa o **significado** do código (variável não usada, `==` em vez de `===`, `any` desnecessário); o Prettier cuida apenas da **aparência** (indentação, quebras de linha, aspas). Usar só uma das duas deixa uma lacuna.

### Por que não usar TDD nesta fase?

O PRD determina TDD para **código de produção**, ou seja, quando existe um comportamento novo a implementar. Aqui não há comportamento novo: a API continua respondendo exatamente o mesmo. O que existe é **configuração de ferramenta**, e a validação dela é o próprio comando (`npm run lint`), não um teste do Vitest.

A suíte existente (5 testes) continua sendo a rede de segurança: depois de formatar os arquivos, ela precisa continuar verde. Se uma alteração de estilo quebrar um teste, algo saiu do escopo de "apenas formatação".

### Relação com o roadmap

Esta fase corresponde ao **passo 7 do roadmap** ("Qualidade de código: configurar ESLint e Prettier"). A inclusão do lint no CI antecipa uma pequena parte do passo 9, porque o pipeline já existe no repositório; sem isso, a ferramenta ficaria só na máquina de quem desenvolve.

---

## Pré-requisitos

Confirme que a Fase 02 está concluída:

```bash
npm test        # esperado: 2 arquivos, 5 testes passando
npm run build   # esperado: sem erros
```

Confira também as versões:

```bash
node --version   # esperado: v20.x ou superior
npm --version    # esperado: 10.x ou superior
```

Se algo falhar, resolva antes de continuar. Não empilhe problemas de fases diferentes.

---

## O que será entregue

| Arquivo / comando | Função |
| ----------------- | ------ |
| `eslint.config.js` | Configuração do ESLint no formato *flat config* (padrão do ESLint 9+). |
| Aliases `typescript` / `@typescript/native` | Mantêm o TypeScript 7 no build e a API 6.0 disponível para o lint. |
| `.prettierrc.json` | Regras de formatação do Prettier. |
| `.prettierignore` | Arquivos e pastas que o Prettier não deve formatar. |
| `npm run lint` | Verifica o código e falha se encontrar erros. |
| `npm run lint:fix` | Corrige automaticamente o que for seguro corrigir. |
| `npm run format` | Formata todos os arquivos com Prettier. |
| `npm run format:check` | Verifica a formatação sem alterar arquivos (útil no CI). |
| `.github/workflows/pipeline.yml` | Pipeline passa a rodar `npm run lint` antes do build. |

Nenhum desses itens altera as rotas, os status HTTP ou o corpo das respostas.

---

## Passo 1 — Instalar as dependências

```bash
npm install -D eslint @eslint/js typescript-eslint globals prettier eslint-config-prettier
```

> **Atenção — TypeScript 7 e `typescript-eslint`:** o projeto usa **TypeScript 7.0.2**, mas o `typescript-eslint` ainda declara suporte a `typescript <6.1.0`. Além disso, o TypeScript 7.0 não expõe a API JavaScript que o `typescript-eslint` consome. A instalação direta falha com `ERESOLVE`; forçar com `--legacy-peer-deps` instala, mas o lint aborta com `typescript-eslint does not support TS 7.0`. A solução oficial da Microsoft é manter os **dois compiladores lado a lado**, usando aliases do npm:

```bash
npm install -D "typescript@npm:@typescript/typescript6@^6.0.2" "@typescript/native@npm:typescript@^7.0.2"
```

Como os aliases ficam no `package.json`:

| Nome no `package.json` | Pacote real instalado | Quem usa |
| ---------------------- | --------------------- | -------- |
| `typescript` | `@typescript/typescript6` (API 6.0.x) | `typescript-eslint` e o comando `tsc6` |
| `@typescript/native` | `typescript` 7.0.x | o comando `tsc` usado no build |

Na prática:

```bash
npx tsc --version                          # Version 7.0.2  (compilador do build)
node -p "require('typescript').version"   # 6.0.3         (API usada pelo ESLint)
```

O build continua usando TypeScript 7; o lint usa a API 6.0, que é compatível com o `typescript-eslint` atual. Quando o `typescript-eslint` suportar a API do TypeScript 7.1+, os aliases poderão ser removidos.

O que cada pacote faz:

| Pacote | Por que é necessário |
| ------ | -------------------- |
| `eslint` | O verificador em si. |
| `@eslint/js` | Conjunto de regras recomendadas para JavaScript. |
| `typescript-eslint` | Parser e regras que ensinam o ESLint a entender TypeScript. |
| `globals` | Lista de variáveis globais conhecidas (`process`, `console`, etc.), para o ESLint não acusar falso positivo. |
| `prettier` | O formatador. |
| `eslint-config-prettier` | Desliga no ESLint as regras de estilo que brigam com o Prettier. |

> Todas são dependências de **desenvolvimento** (`-D`): elas não são necessárias para a API rodar em produção, apenas para verificar e formatar o código durante o desenvolvimento e no CI.

---

## Passo 2 — Criar o `eslint.config.js`

O projeto usa `"type": "commonjs"` no `package.json`. Por isso, a configuração usa `require` e `module.exports`, e não `import`/`export`. Se o projeto fosse ESM (`"type": "module"`), o arquivo poderia usar `import` ou ser renomeado para `eslint.config.mjs`.

Crie `eslint.config.js` na raiz:

```js
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
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
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
```

Detalhes didáticos:

- **`ignores`** evita que o ESLint perca tempo analisando `node_modules/` e `dist/`.
- **`files`** limita a análise a `src/` e `tests/`. O `dist/` é gerado pelo build e não deve ser verificado.
- **`argsIgnorePattern: "^_"`** é o que permite manter `_req` nos handlers, convenção já usada desde a Fase 01.
- **`no-require-imports: "off"`** vale só para `eslint.config.js`, porque o projeto é CommonJS e o próprio arquivo de configuração precisa usar `require`.
- **`prettier` por último** é obrigatório: ele é um "desligador" de regras conflitantes. Se ficar antes, o ESLint pode continuar reclamando de estilo que o Prettier já resolve.

---

## Passo 3 — Criar o `.prettierrc.json`

Crie `.prettierrc.json` na raiz:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "endOfLine": "lf"
}
```

O que cada opção faz:

| Opção | Efeito |
| ----- | ------ |
| `semi` | Acrescenta ponto e vírgula ao final das instruções. |
| `singleQuote` | Usa aspas duplas (`false`), como o código já faz. |
| `trailingComma` | Deixa vírgula no último item de listas e objetos de múltiplas linhas. |
| `printWidth` | Quebra linhas acima de 100 caracteres. |
| `endOfLine` | Padroniza o fim de linha como `LF`, evitando diferenças entre Windows e Linux. |

Essas escolhas **seguem o estilo que o projeto já usa**. O objetivo não é impor um estilo novo, e sim impedir que o estilo vá variando arquivo a arquivo.

---

## Passo 4 — Criar o `.prettierignore`

Crie `.prettierignore` na raiz:

```
dist/
node_modules/
coverage/
package-lock.json
skills-lock.json
.agents/
docs/
AGENTS.md
```

- `dist/` é gerado pelo build.
- `coverage/` só existirá se a cobertura de testes for configurada no futuro.
- `package-lock.json` e `skills-lock.json` são gerados por ferramentas e não devem ser reformatados à mão.
- `.agents/`, `docs/` e `AGENTS.md` são conteúdo didático e de ferramentas, não código da API. Formatá-los geraria um diff grande sem ganho para o comportamento do projeto.

---

## Passo 5 — Adicionar os scripts

No `package.json`, **acrescente** as quatro entradas ao bloco `"scripts"` existente. Não substitua os scripts de `dev`, `build`, `start`, `test`, `test:watch` e `up:db`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- `lint` é o comando exigido pelo PRD. Ele precisa **falhar** quando houver erro.
- `lint:fix` corrige automaticamente apenas o que é seguro.
- `format` reescreve os arquivos com o estilo do Prettier.
- `format:check` não altera nada; apenas responde se o código está formatado. É o comando ideal para o CI.

> O script `up:db` já existe no projeto e continua igual. Esta fase não altera Docker nem banco de dados.

---

## Passo 6 — Rodar e corrigir

Primeiro, veja o estado atual do código:

```bash
npm run lint
```

Saída esperada se estiver tudo certo: **nenhum erro** e código de saída `0`.

Se aparecerem erros, corrija um por vez. Muitos podem ser resolvidos com:

```bash
npm run lint:fix
```

Depois, formate o projeto:

```bash
npm run format
```

O Prettier vai reescrever os arquivos que estiverem fora do padrão. **Revise o diff antes de commitar:**

```bash
git diff
```

O que deve aparecer no diff:

- espaços, indentação, quebras de linha e aspas;
- nenhuma mudança de lógica;
- nenhuma alteração de status HTTP, rota ou mensagem da API.

Se o diff mostrar mudança de comportamento, algo saiu do escopo. Reverta e refaça apenas a formatação.

---

## Passo 7 — Rodar os testes e o build

Qualidade de código não pode quebrar o que já funciona. Confirme:

```bash
npm test
npm run build
```

Esperado:

```
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

E o build termina sem erros.

Se um teste falhar depois da formatação, **não altere o teste para ele passar**. O teste é o contrato da API; a formatação não deveria mudar comportamento. Investigue o diff e desfaça a mudança indevida.

---

## Passo 8 — Incluir o lint no CI

O pipeline atual está em `.github/workflows/pipeline.yml` e já roda:

```yaml
- run: npm ci
- run: npm run build
- run: npm run test
```

Acrescente o lint **entre a instalação e o build**:

```yaml
- run: npm ci
- run: npm run lint
- run: npm run build
- run: npm run test
```

Por que nessa posição?

- O lint é rápido e pega problemas antes de gastar tempo compilando.
- Se o lint falhar, o job `test` falha.
- Os jobs `deploy-dev` e `deploy-prod` dependem de `test` (`needs: test`). Portanto, **lint quebrado bloqueia o deploy**.

Isso fecha o requisito do PRD de que os testes (e agora também a qualidade) bloqueiem a publicação.

---

## Como validar (obrigatório antes de seguir)

**0. Instalação reproduzível (com os aliases):**

```bash
rm -rf node_modules
npm ci
```

Esperado: instalação conclui **sem `ERESOLVE`** e sem `--legacy-peer-deps`. Em seguida, confirme que os dois compiladores convivem:

```bash
npx tsc --version                          # esperado: Version 7.0.2
node -p "require('typescript').version"   # esperado: 6.0.3
```

**1. Lint sem erros:**

```bash
npm run lint
```

Esperado: nenhuma mensagem de erro, código de saída `0`.

**2. Formatação consistente:**

```bash
npm run format:check
```

Esperado (trecho):

```
Checking formatting...
All matched files use Prettier code style!
```

**3. Testes continuam verdes:**

```bash
npm test
```

Esperado: **5 testes** passando.

**4. Build continua funcionando:**

```bash
npm run build
```

Esperado: `tsc` termina sem erros.

**5. O ESLint realmente detecta erro (teste negativo):**

Acrescente temporariamente uma linha com uma variável não usada em qualquer arquivo de `src/`:

```ts
const unused = 1;
```

Rode:

```bash
npm run lint
```

Esperado: erro `@typescript-eslint/no-unused-vars` e código de saída diferente de `0`. **Remova a linha depois** e rode `npm run lint` novamente para confirmar que voltou a passar.

Esse passo é importante: um lint que nunca falhou não prova que está funcionando.

**6. O CI roda o lint:**

Abra um Pull Request para `develop` e confira no GitHub Actions que o job **"Build e testes"** executa a etapa `npm run lint` antes de `npm run build` e `npm run test`.

**7. Confirme que nenhum endpoint mudou:**

```bash
npm run dev
```

Em outro terminal:

```bash
curl -i http://localhost:3000/api/items
curl -i -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"item"}'
curl -i -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"item atualizado"}'
curl -i -X DELETE http://localhost:3000/api/items/1
```

Esperado: `200`, `201`, `200`, `200`, todos com `{ "status": "ok" }`. Encerre com `Ctrl+C`.

---

## Critérios de conclusão

- [x] `eslint` e `prettier` instalados como dependências de desenvolvimento.
- [x] Aliases `typescript` (API 6.0) e `@typescript/native` (TypeScript 7) configurados.
- [x] `npm ci` instala sem `ERESOLVE` e sem `--legacy-peer-deps`.
- [x] `eslint.config.js` existe e usa o formato flat config.
- [x] `.prettierrc.json` e `.prettierignore` existem.
- [x] `npm run lint` termina com código `0` no código atual.
- [x] `npm run lint:fix` e `npm run format` estão disponíveis.
- [x] `npm run format:check` passa.
- [x] O teste negativo (variável não usada) faz o lint falhar.
- [x] `npm test` continua com **5 testes** verdes.
- [x] `npm run build` continua sem erros e usa TypeScript 7.
- [x] O CI executa `npm run lint` antes de `build` e `test`.
- [x] Falha de lint impede o deploy (job de deploy depende de `test`).
- [x] Nenhum endpoint, status HTTP ou resposta JSON foi alterado.
- [x] O diff de formatação não contém mudança de comportamento.

### Como foi verificado

Checagens executadas localmente em 12/11/2026:

| Critério | Comando | Resultado obtido |
| -------- | ------- | ---------------- |
| Instalação limpa | `rm -rf node_modules && npm ci` | concluiu sem `ERESOLVE` e sem flags extras |
| Versões dos compiladores | `npx tsc --version` / `node -p "require('typescript').version"` | `7.0.2` para o build; `6.0.3` para a API do lint |
| Lint | `npm run lint` | código de saída `0`, sem erros |
| Teste negativo | arquivo temporário com `const unused = 1;` + `npm run lint` | erro `@typescript-eslint/no-unused-vars`, código de saída `1`; arquivo removido depois |
| Formatação | `npm run format:check` | `All matched files use Prettier code style!` |
| Testes | `npm test` | 2 arquivos, **5 testes** passando |
| Build | `npm run build` | `tsc` (TypeScript 7.0.2) sem erros |
| CI | Pull Request #7 (GitHub Actions) | job **"Build e testes"** passou executando `npm ci`, `npm run lint`, `npm run build` e `npm test`; deploys dev/prod ignorados por ser PR |

**Versões instaladas nesta execução:** ESLint `10.14.0`, `typescript-eslint` `8.72.2`, `@eslint/js` `10.0.1`, Prettier `3.10.1`, `eslint-config-prettier` `10.1.8`, `globals` `17.14.0`.

Com o lint dentro do job `test`, uma falha de qualidade impede que os jobs de deploy recebam `needs: test` satisfeito. O bloqueio efetivo do deploy será exercitado naturalmente nas próximas falhas de pipeline.

---

## Problemas comuns

| Sintoma | Causa provável |
| ------- | -------------- |
| `ERESOLVE ... peer typescript@">=4.8.4 <6.1.0"` | Falta o alias `typescript@npm:@typescript/typescript6`; o projeto está com TypeScript 7 direto. |
| `typescript-eslint does not support TS 7.0` | Instalou com `--legacy-peer-deps`; o TS 7.0 não expõe a API JavaScript. Aplique os aliases da seção do Passo 1. |
| `npm run build` usa TypeScript 6 sem querer | Link antigo do binário `tsc`; rode `rm -rf node_modules && npm ci` e confirme `npx tsc --version` em `7.0.2`. |
| `Parsing error` em arquivo `.ts` | O `typescript-eslint` não foi incluído no `eslint.config.js` ou o arquivo está fora de `files`. |
| `'process' is not defined` | Faltou `globals.node` em `languageOptions.globals`. |
| `Definition for rule ... was not found` | Falta um plugin/regra que não foi instalado; confira o `npm install -D`. |
| ESLint e Prettier reclamando do mesmo trecho | `eslint-config-prettier` não está **por último** na configuração. |
| `Invalid option '--ext'` | O flat config do ESLint 9 não usa `--ext`; use `eslint .` e os padrões de `files`. |
| `require is not defined` | O projeto foi marcado como `"type": "module"`; neste projeto ele é `commonjs`, então mantenha `require` ou renomeie o config para `.mjs` e use `import`. |
| Diff gigante depois de `npm run format` | Era esperado na primeira execução. Rode uma vez, revise e commite separado para não misturar formatação com lógica. |
| Lint passa localmente e falha no CI | Configs não foram commitadas, ou o CI está rodando uma versão diferente de dependências. Confira `package-lock.json` e o diff do PR. |
| Teste falha após formatação | Alguma alteração saiu do escopo de estilo. Revise o diff e reverta o que mudou comportamento. |

---

## Próxima fase

A **Fase 04** ainda não está documentada. Antes de avançar, o conteúdo deve ser definido com o Marcos e registrado em `/docs/04-*.md`, conforme a regra do `AGENTS.md`: a pasta `docs/` é a fonte de verdade da sequência, e nenhuma fase deve ser inventada.
