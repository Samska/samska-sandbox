# Reconstrução — ambiente e evidências

## Escopo da evidência

Inspeção e comandos executados em 2026-10-15 pelo Orquestrador. A descoberta usa a base `ec92cd35073ea3b52afa13a740f75fb0788f6c2b`; qualquer commit documental posterior não constitui implementação da reconstrução.

## Integração Maestri

- Skills `maestri-manager` e `maestri` carregadas; comandos descobertos com `maestri help`, `preset list` e `recruit --help`.
- `maestri list` identificou `Orquestrador`, sem conexões antes do teste.
- `maestri recruit "Arquitetura" --dir <pasta de reconstrução>` criou terminal conectado por cópia do Orquestrador, sem preset/command alternativo.
- `maestri ask` entregou instrução de confirmação somente leitura. O retorno por `maestri ask "Orquestrador"` trouxe `SAMSKA-ACK-01`; `maestri check` também mostrou o terminal do especialista e o canal conectado.
- Arquitetura verificou o diretório com `pwd -W`: pasta de reconstrução. CLI OpenCode e modelo `openai/gpt-6.1-sol` coincidem com a identidade do harness do Orquestrador. A versão da CLI não foi verificada.
- **Effort/variant não disponível/verificado em nenhum dos dois terminais.** A cópia do agente não comprova igualdade de effort; nenhum valor foi inventado ou alterado.
- Qualidade foi recrutado depois de nova consulta à equipe. Ambos receberam análise somente leitura, proibidos de implementar, editar arquivos, fazer Git writes ou recrutar terceiros.
- Não foram usados subagentes internos. Nenhuma falha de conexão ocorreu no teste.

## Preparação Git

| Item | Evidência |
| --- | --- |
| Checkout original | `C:\Users\Samuel\Desktop\samska-sandbox` |
| Destino/worktree | `C:\Users\Samuel\Desktop\samska-sandbox-rebuild` |
| Remote fetch/push | `https://github.com/Samska/samska-sandbox.git` |
| Branch padrão | `main`, confirmada por `git ls-remote --symref origin HEAD` |
| Original antes | `main`, HEAD `ec92cd35073ea3b52afa13a740f75fb0788f6c2b`, limpo, igual a `origin/main` |
| Destino antes | Vazio, inclusive ocultos, confirmado por leitura do diretório e `ls -la`; nenhuma configuração Maestri local para mover/copiar |
| Branch antes | `git branch --list rebuild/maestri` sem resultado; apenas worktree original registrada |
| Atualização | `git fetch origin`, concluído sem erro |
| Criação | `git worktree add -b rebuild/maestri <destino> origin/main`, concluído sem erro |
| Base/merge-base | `ec92cd35073ea3b52afa13a740f75fb0788f6c2b` |
| Verificação inicial | Nova worktree limpa em `rebuild/maestri`; original continua em `main`, mesmo HEAD e status limpo; ambas na lista de worktrees |

Nenhum `git init`, novo repositório, reset, force push, remoção da aplicação, troca da branch original, mudança de diretório dos terminais ou reinício do workspace foi necessário. Fetch/branch/worktree alteram metadados Git compartilhados, conforme autorizado; não alteram os arquivos nem a branch do checkout original. Não foi executado comando que reorganiza ou copia configurações Maestri.

## GitHub consultado (somente leitura)

- `gh issue list --state open --limit 100`: uma Issue aberta, #64 / SS-038; responsável Samska, labels `type: chore` e `area: testing`.
- `gh issue view 64 --json ...projectItems`: handoff `Awaiting approval`; a saída desta consulta foi `projectItems: []`. O especialista encontrou limitação de escopo `read:project` em sua consulta; portanto a saída vazia não prova ausência de vínculo. Vínculo/Status/Priority do Project permanecem não verificados, sem ampliar permissões.
- `gh pr list --state open --limit 100`: nenhuma PR aberta.
- Issue #77 / SS-042 fechada; PR #78 fechada e merged, squash `eb829cc4e9e1aeba5e1400c1174bf267da4be94e`.
- Check runs do head revisado `cffb4217017bd027b8fefc7f50b37c4302bfbe57`: onze resultados `success`, incluindo Backend, Frontend, Repository validation, Browser E2E, relatórios de testes, CodeQL e GitGuardian. Isso é evidência histórica daquele head, não CI do plano.
- Release `v0.1.0 — First Order` publicada em 2026-10-15, consultada com `gh release view`.
- Nenhuma Issue, label, Project, PR, release ou configuração remota foi criada/editada nesta fase.

## Verificação atual da base

| Comando | Diretório | Resultado |
| --- | --- | --- |
| `node --version` | reconstrução | `v24.21.0`: satisfaz `>=24.20.0 <25`, não coincide com patch 24.20.0 do `.nvmrc` |
| `npm --version` | reconstrução | `11.19.0` |
| Java selecionado por `JAVA_HOME` | reconstrução | Temurin `25.0.4.1` |
| `npm ci --ignore-scripts` | `web` | 132 pacotes adicionados, 133 auditados, zero vulnerabilidades reportadas |
| `./mvnw --batch-mode --no-transfer-progress verify` | `backend` via Git Bash | BUILD SUCCESS; 136 testes, zero falhas/erros/skips |
| `npm run typecheck` | `web` | Passou |
| `npm test` | `web` | 173 testes, 20 arquivos, todos passaram |
| `npm run build` | `web` | Passou; Vite 8.2.2 |
| `git diff --exit-code HEAD --` | original | Passou, sem alteração de arquivos rastreados |

Os testes foram executados pelo Orquestrador, não aceitos apenas por relato dos especialistas. Nenhum teste de browser foi executado nesta fase: há inspeção da suíte e CI histórico separadamente. Não foram iniciados dev servers persistentes, Docker ou PostgreSQL. O smoke test backend iniciou seu servidor efêmero em porta aleatória como parte da suíte.

Estado dos testes: executados na worktree ec92cd35073ea3b52afa13a740f75fb0788f6c2b antes da criação dos documentos desta fase; `git status --short --untracked-files=all` após os checks estava vazio. Arquivos versionados de aplicação/configuração eram os da base, não uma implementação em andamento. Alterações posteriores são documentais, sem modificar o código testado; não se afirma que sejam CI ou execução de toda a suíte no futuro commit documental. Saídas dos comandos foram observadas nesta sessão e não reproduzidas pelos revisores somente leitura.

Human Verification desta entrega documental: **Not applicable** para comportamento de aplicação, pois nenhum comportamento foi modificado. A aprovação humana do plano continua pendente e obrigatória. Não se reivindica nova Human Verification de runtime, UX ou segurança.

CI Verification do plano: **não executada**; o workflow CI versionado dispara em pull requests para main, e nenhuma PR foi autorizada/criada.

## Local Environment Changes

- Criada a worktree e branch de planejamento; metadados Git compartilhados com o original, sem mudar seu HEAD/branch/arquivos.
- Criados dois terminais especialistas no canvas Maestri, ambos no diretório da reconstrução.
- Instaladas dependências frontend apenas na worktree (`web/node_modules`); gerados `web/dist`, caches TypeScript e `backend/target` ignorados pelo Git. Caches usuais npm/Maven podem ser usados/atualizados pelas ferramentas.
- Nenhum JDK/Node/npm global, variável, porta fixa, `.env`, volume, serviço ou configuração canônica foi alterado. Nenhuma migração ou ação manual necessária para esta preparação.
- Para reproduzir checks na worktree: executar os comandos da tabela. Para runtime futuro, consultar o guia canônico [Local Development](../LOCAL-DEVELOPMENT.md), observando a divergência Windows apontada no [plano](PLAN.md).

## Registro final

Plano e evidências permanecem propostos até aprovação. Distribuição de modelos posteriormente autorizada e aplicada com evidência de sessão/turnos em [MODELS.md](MODELS.md); isso não muda o resultado histórico do primeiro teste por cópia.

- Revisão independente de Arquitetura recebida: clarificar protocolo compartilhado P4/P5, tornar Admin opcional, explicitar autorização de escrita futura, preservar contratos e gates humanos por fatia e rastrear alias Product/decisões monetárias. O Orquestrador conferiu o compartilhamento dos guards em Catalog, a referência mutável em ProductSnapshot/store e os exemplos documentais antes de atualizar o plano. Nenhuma correção de aplicação foi feita.
- O plano agora define um único owner do protocolo de guards, compartilhado por reads e comandos durante a transição; se isso não puder ser preservado numa fatia pequena, interromper e replanejar antes de Build adicional.
- Revisão independente de Qualidade recebida: incorporados artefato explícito de paridade em P1, caracterização dos invariantes afetados, precisão de scope Project, rastreabilidade do estado testado, gates documentais e distinção launcher/Playwright. Foram recusadas como pré-requisitos não justificados a remoção de branches antigas e mutation testing universal. Nenhuma branch antiga foi reutilizada ou removida. Os dois relatórios revisaram rascunhos; não se presume aprovação automática das correções posteriores.
- `git diff --check`: passou; Git avisou normalização futura LF → CRLF de PROJECT_HANDOFF, sem erro de whitespace. O comando não inclui arquivos novos não rastreados.
- Após staging conjunto dos quatro documentos, `git diff --cached --check` passou incluindo os arquivos novos. O diff staged contém somente esses documentos; `git diff HEAD --name-only -- backend web scripts .github compose.yaml` ficou vazio. Links relativos/newlines foram checados novamente, zero erros.
- Verificação Node dos quatro documentos novos/alterados: todos os destinos relativos de links existem e há newline final; zero erros. Não verifica fragments nem substitui Markdown lint/EditorConfig.
- `command -v markdownlint-cli2 lychee editorconfig-checker`: ferramentas não encontradas no PATH; checks completos de Markdown/links-fragments/EditorConfig não executados, sem instalar tooling nesta fase.
- Última reinspeção: checkout original limpo em `main`, mesmo HEAD ec92cd3 e igual a origin/main; lista de worktrees contém original/main e reconstrução/rebuild/maestri no mesmo commit-base.
- Até este registro, documentos sem commit/push; o commit documental deve incluir conjuntamente PROJECT_HANDOFF e os três documentos em docs/rebuild, evitando referências ausentes em outro checkout. Implementação não alterada. O SHA final, se criado, será informado na entrega, não embutido recursivamente no próprio commit.

README impact: **No**. O produto/stack/runtime não mudou e a proposta ainda não foi aprovada. Nenhum Learning Record ou ADR é criado para fingir decisão aceita; se o trabalho aprovado estabelecer estratégia/decisão material, criar o registro pertinente na entrega correspondente.
