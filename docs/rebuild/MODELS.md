# Distribuição de modelos — configuração aplicada

## Política operacional atual — escolha por tarefa

O proprietário substituiu a distribuição fixa e as restrições anteriores: o Orquestrador pode escolher/trocar seu próprio modelo e os dos especialistas, inclusive OpenAI quando justificado, somente pelos planos existentes. Economia de cota é requisito. Relato do proprietário: aproximadamente 78% da janela OpenAI de cinco horas consumida em menos de uma hora; não é telemetria consultada pelo agente.

Priorizar Go na execução/integração corrente para aliviar OpenAI; selecionar o menor esforço adequado à complexidade, contexto e risco. Usar revisão mais capaz em mudanças de alto risco, reduzir para trabalho delimitado quando apropriado e evitar alternâncias por mensagem. Não há roteador automático comprovado: são seleções explícitas por sessão via API V2 ou `/models`, verificadas em `session.get` e no próximo metadado assistant. Papel no prompt não seleciona modelo. Em troca, preservar arquivos, relatórios e estado da entrega; não interromper geração/ferramenta ativa.

Catálogo consultado nesta revisão: 6 modelos OpenAI disponíveis e 23 Go. OpenAI: gpt-6.1-sol, gpt-6-luna, gpt-6-astra, gpt-5.6-terra, gpt-5.5 e gpt-5.3-codex-spark. Go inclui DeepSeek V4.1 Flash/Pro, GLM-5.3 Flash, MiniMax M3, Kimi K2.7 Code e outras opções. Availability/variants foram consultados; preços por token retornados pelo catálogo não comprovam pesos de consumo das assinaturas. Não há medição aqui de saldo/reset por modelo, nem multiplicadores inventados. Nenhuma configuração de crédito, overage ou serviço pago novo é autorizada.

Ponto seguro R1 antes da troca do Orquestrador: autores encerraram escrita; revisão inicial Crivo identificou B1 (proxy intercepta módulos frontend), D1 (novo submit após saved/error) e D2 (moeda/apresentação); Trama relatou correções com 63 testes. Orquestrador confirmou backend padrão e candidato com 188 testes cada, manifests corretos e aplicação antiga preservada; primeiro E2E candidato falhou por UI branca (trace disponível); nova rodada e revisão final pendentes. Código permanece sem commit aguardando Human Verification. Checkpoint documental publicado: 0dd38de, upstream origin/rebuild/maestri. Logs e código não serão descartados na troca.

O histórico abaixo registra seleções anteriores e não impõe mais modelos fixos nem proibição geral de especialistas OpenAI.

## Terminais ativos e nomes funcionais

Nomes padronizados por responsabilidade (sem apelidos): Orquestrador, Arquitetura, Qualidade, Backend, Frontend, Design UX/UI, Revisão de Código, Infraestrutura/CI.

| Terminal | Modelo efetivo (verificado) | Responsabilidade |
| --- | --- | --- |
| Orquestrador | `opencode-go/deepseek-v4.1-flash#high` | Coordenação, integração, verificação das evidências, operações Git |
| Arquitetura | `opencode-go/kimi-k2.7-code#default` | Requisitos, contratos, decisões técnicas, revisão de plano |
| Qualidade | `opencode-go/deepseek-v4.1-flash#high` | Estratégia de testes, automação, execução e evidências |
| Backend | `opencode-go/kimi-k2.7-code#default` | Domínio, APIs e persistência (futura, só se aprovada) |
| Frontend | `opencode-go/minimax-m3#thinking` | Interface, acessibilidade, integração e direção visual do candidato |
| Design UX/UI | `opencode-go/minimax-m3#thinking` | Revisão visual independente e crítica de experiência (read-only) |
| Revisão de Código | `opencode-go/deepseek-v4-pro#high` | Revisão independente de código e aderência a requisitos |
| Infraestrutura/CI | `opencode-go/glm-5.3-flash#high` | Ambiente, launcher e pipelines |

Renomear no Maestri exige `recruit --replace` (reinicia o processo; a sessão é retomada pelo `--session`), portanto só é feito com o terminal ocioso. O terminal do Orquestrador aparece no canvas como `Maestro` e não pôde ser renomeado durante a sessão em execução, porque isso encerraria a própria sessão; renamá-lo exige ação na interface ou reinício autorizado.

## Estado em 2026-10-15

O proprietário autorizou o Orquestrador a escolher os modelos e confirmou que os dois planos já estão configurados, sem consumo extra: ao atingir limites, aguardar reset. Retomada somente de revisão do planejamento; implementação ainda aguarda aprovação. Não recrutar especialistas OpenAI nem permitir recrutamento recursivo. Limite: dois especialistas. Nenhuma configuração de cobrança, crédito, credencial ou provider foi criada ou alterada.

O plano inicial em `0fad2be` recebeu revisão independente, mas o proprietário rejeitou sua direção de refatoração. A intenção agora é implementar do zero; [RECONSTRUCTION.md](RECONSTRUCTION.md) é o plano executivo revisado, ainda sem aprovação. As consultas seguintes são pontuais, não repetição do diagnóstico. Nenhum push, PR ou merge foi feito até este registro.

## Verificação de configuração

- Presets Maestri: Claude Code, Codex, Antigravity, OpenCode e Shell.
- `maestri preset show "OpenCode"`: comando `opencode`, Maestro off, chat off, Quick Start on. Preset escolhe a CLI, não garante modelo/provider/variant.
- Catálogo local retornou provider `opencode-go` (OpenCode Go), distinto de `opencode` e `openai`, com 24 modelos atuais. A documentação oficial Go confirma a oferta por assinatura. Catálogo não comprova saldo disponível ou configuração de overage da conta.
- API V2 de sessões identificou Orquestrador e dois especialistas em `openai/gpt-6.1-sol`, variant `default` antes da mudança. Isso melhora a evidência anterior baseada só no harness: default não deve ser chamado Medium sem verificação.
- Por solicitação explícita, apenas o Orquestrador foi selecionado em `openai/gpt-6.1-sol#medium` via `session.switchModel`. `session.get` e metadados da mensagem assistant subsequente confirmaram `providerID: openai`, `id: gpt-6.1-sol`, `variant: medium`.
- Após autorização, a opção A foi aplicada via `session.switchModel` às sessões existentes, sem reinício nem novos agentes. Arquitetura: `opencode-go/kimi-k2.7-code`, variant `default` (nenhuma variante nomeada no catálogo); Qualidade: `opencode-go/deepseek-v4.1-flash#high`. Ambos receberam revisão independente somente leitura do plano, proibidos de implementar, editar ou recrutar.
- Mensagens assistant posteriores à troca confirmaram ambos: Arquitetura `opencode-go/kimi-k2.7-code`, variant `default`; Qualidade `opencode-go/deepseek-v4.1-flash`, variant `high`. A confirmação usa metadados reais do cliente, não autodeclaração no prompt.

## Opções avaliadas — A selecionada

| Opção | Arquitetura | Qualidade | Motivo |
| --- | --- | --- | --- |
| A — recomendada | `opencode-go/kimi-k2.7-code` (sem variant no catálogo) | `opencode-go/deepseek-v4.1-flash#high` | Duas famílias diferentes, ambas incluídas em Go; reservar análise mais extensa para Arquitetura, revisão independente em outra família |
| B — priorizar cotas | `opencode-go/minimax-m3#thinking` | `opencode-go/glm-5.3-flash#high` | Alternativa com cotas publicadas maiores que alguns modelos premium; não é benchmark de qualidade neste projeto |

Orquestrador permanece GPT-6.1 Sol Medium. Provider de acesso dos especialistas: OpenCode Go; famílias/modelos respectivamente Kimi (Moonshot), DeepSeek, MiniMax e GLM (Z.ai). Não usar modelos GPT por Go como forma de alegar diversificação de família.

Catálogo Go local completo nesta consulta: `gemini-4-argon-contributor`, `cat-jam-free`, `claude-haiku-5-5`, `longcat-2.5-preview-free`, `space-bunny`, `mimo-v2.6-pro`, `gpt-6-luna`, `grok-4.7`, `step-5-preview-free`, `deepseek-v4.1-flash`, `muse-spark-1.3-contributor`, `hy4-preview`, `glm-5.3-flash`, `qwen3.8-flash`, `glm-5.3`, `qwen3.8-max`, `kimi-k3`, `kimi-k2.7-code`, `qwen3.7-plus`, `minimax-m3`, `deepseek-v4-pro`, `mimo-v2.5`, `mimo-v2.5-pro`, `minimax-m2.7`. Todos com prefixo `opencode-go/`. Disponibilidade futura pode mudar; conferir catálogo antes de aplicar.

### Papéis futuros — não recrutados

O [plano revisado](RECONSTRUCTION.md#7-equipe-modelos-e-momento-de-entrada) define Backend em `opencode-go/kimi-k2.7-code` Default, Frontend em `opencode-go/minimax-m3#thinking`, Revisor em `opencode-go/deepseek-v4-pro#high` e Infraestrutura/CI em `opencode-go/glm-5.3-flash#high`. Nesta revisão o catálogo confirmou os três últimos IDs e variantes; Kimi já é usado por Arquitetura. Isso confirma disponibilidade no catálogo, não configuração de terminais ainda inexistentes nem benchmark de adequação.

Nenhum desses novos especialistas foi criado. Entrada só após aprovação e necessidade concreta, em turnos com no máximo dois especialistas trabalhando; candidatos só recebem tarefa substantiva após seleção real e confirmação por metadados da sessão e de um turno curto. Proibição de recrutamento recursivo permanece. O Orquestrador é o único recrutador/integrador.

## Aplicação e comprovação após escolha

Preferir trocar a seleção da sessão existente, preservando terminal e histórico, por `/models` ou API V2 `session.switchModel`; não reiniciar/recrutar só para trocar modelo. Selecionar variante real do catálogo, não instruir esforço no texto do prompt. Conferir `session.get` e o campo `model` da próxima mensagem assistant; este último comprova a seleção usada pelo cliente para aquele turno, não uma auditoria independente do servidor de inferência.

`maestri check` permite observar o terminal; `maestri list` comprova conexões e quantidade, não o modelo. Se precisar usar replace com preset OpenCode, preservar primeiro todos os resultados, pois o processo/histórico pode reiniciar. Não é necessário nesta proposta.

A CLI TUI instalada não anuncia flag `--model` no comando raiz. Não confundir com `opencode run --model`, que é outro modo de execução. Manualmente: abrir `/models` no terminal correto, escolher entrada sob OpenCode Go e sua variante disponível; no Orquestrador manter GPT-6.1 Sol / Medium. Se Go não estiver conectado, parar e solicitar login pela interface existente, sem pedir chave no chat ou criar API paga.

## Limites de cobrança

A documentação Go define cotas por modelo e janelas de cinco horas, semana e mês. Preços por token no catálogo contabilizam essas cotas e não provam cobrança avulsa. A opção **Use balance**, se habilitada na Console, permite consumir saldo pay-as-you-go após a cota. A configuração privada não foi consultada nem alterada; o proprietário confirmou planos existentes sem consumo extra, bloqueando até reset ao atingir limite. Não habilitar saldo, auto-recharge ou fallback pago. Ao esgotar cota: parar e informar, não trocar de plano/provider automaticamente.

O caminho de autenticação/billing ChatGPT Plus do Orquestrador também não foi auditado nesta consulta; custo zero em metadados não é prova de assinatura. Não foram lidas credenciais nem iniciadas inferências de teste nos modelos Go.

Fontes oficiais: <https://opencode.ai/v2/docs/console/go/>, <https://opencode.ai/v2/docs/models>, <https://opencode.ai/v2/docs/api/>. A tentativa inicial `/v2/docs/go` retornou 404; o índice oficial indicou o endereço Console/Go acima.

## Resultados anteriores preservados

Os dois relatórios chegaram de tarefas já iniciadas, não de novas delegações após a pausa. São inspeções somente leitura; não equivalem a revisão do rascunho PLAN.md nem a prova de defeitos em runtime.

### Qualidade

- Confirma baseline ec92cd3, CLI OpenCode 2.0.29, análise sem edits/testes/instalações. Issue #64 aguarda aprovação; especialista relata ausência de permissão read:project, sem ampliar permissões.
- Alto: definir paridade/aceite antes de Build; dois E2E não cobrem Admin/multipart, temporary failure, perda de resposta ou capacidade em browser; exposição externa sem auth é proibida pelo escopo local.
- Médio: `InMemoryOrderStoreTest.java:93-127` inicia segunda thread e libera primeira sem comprovar disputa; testar interleaving observável se sincronização mudar. Não demonstrou corrida de produção.
- Médio: exemplo de criação em `docs/LOCAL-DEVELOPMENT.md:139-141` omite description obrigatória; `docs/GITHUB.md:29` omite Browser E2E existente. Confirmar diretamente antes de corrigir.
- Required checks diferidos; verde histórico não serve de CI do novo SHA. Manter proveniência Agent/Human/CI separada, testes de snapshots/replay/guards e verificação humana proporcional. Nenhum teste executado pelo especialista.

### Arquitetura

- Confirma base e jornadas; Catalog concentra 1085 linhas na versão inspecionada. Recomenda paridade incremental e extração feature-local, sem router/store global novo ou big-bang.
- Adaptadores Cart/Payment/Order validam chaves exatas: campo aditivo JSON pode não ser compatível. Preservar formas, status e códigos HTTP.
- Possível alias de Product mutável em leituras de store/snapshot; nenhum caminho HTTP corruptor demonstrado. Correção deve ser fatia separada, aprovada e caracterizada, não inserida silenciosamente na reconstrução.
- Preço sem escala/teto e nome/preço capturados na primeira inclusão do Cart são comportamento atual; não impor moeda/arredondamento/reprecificação como correção implícita.
- Preservar ADRs, supersessões, locks direcionais, snapshot/replay, Order explícito sem limpar Cart e recovery GET-only. Alinhar divergências documentais sem reescrever histórico.
- Propõe caracterização → extração de jornada → aceite; alias de Product opcional e independente. Não executou testes/build/servidores nem consultou CI/Project ao vivo.

## Próximo passo

Distribuição do trio mantida e consultas pontuais concluídas; especialistas sem novas tarefas. Aguardar aprovação humana antes de implementar ou recrutar papéis futuros. Aprovar distribuição de modelos não aprova implementação da reconstrução. Sem nova pergunta ao proprietário sobre cobrança: sua confirmação foi registrada.
