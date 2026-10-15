# Samska Sandbox — diagnóstico e proposta de reconstrução

## Estado e autorização

- Data: 2026-10-15. Estado: **Awaiting approval**.
- Revisão 2: o proprietário rejeitou a direção de refatoração incremental do commit `0fad2be` e definiu reconstrução da implementação do zero, em entregas pequenas. Essa intenção está decidida; arquitetura, backlog e transição revisados ainda aguardam aprovação.
- Esta entrega prepara o ambiente e propõe o plano; não autoriza implementação.
- A implementação existente permanece integral. Nenhuma dependência ou configuração de aplicação versionada foi alterada nesta fase; alterações se limitam aos documentos de planejamento e handoff.
- Repositório preservado: <https://github.com/Samska/samska-sandbox>.
- Evidências e limites da verificação: [VERIFICATION.md](VERIFICATION.md).
- Diagnóstico existente reaproveitado abaixo. O plano executivo vigente está em [RECONSTRUCTION.md](RECONSTRUCTION.md), que substitui o backlog P0–P7 anterior. Requisitos, ADRs, governança e roadmap não são silenciosamente substituídos.

## Diagnóstico do produto

### Requisitos documentados

Fontes: [Product](../PRODUCT.md), [Roadmap](../ROADMAP.md), [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md) e [README](../../README.md).

O produto é um laboratório público, educacional e não comercial de engenharia, com comércio e logística fictícios. O marco First Order já está entregue: navegar por produtos, montar e editar um Cart, simular pagamento, criar explicitamente um Order e recuperar a confirmação por URL. A licença Apache-2.0 e o histórico não devem mudar.

| Jornada/capacidade | Estado documentado e observado no código | Limites a preservar |
| --- | --- | --- |
| Market | Catálogo, detalhe de Product, feedback e Cart drawer | Responsividade, teclado, foco e fallback de mídia |
| Admin | Lista com busca local por nome, criação, edição e exclusão confirmada | Rota não é autorização; exclusão bloqueada enquanto Product está no Cart |
| Mídia | Upload, substituição, remoção e leitura de um JPEG por Product | Validação/re-encoding, publicação atômica, limites e estado intacto na rejeição |
| Cart/Checkout | Cart único do processo, quantidades, remoção e totais do servidor; Checkout editável | Sem recurso/backend Checkout; editar Cart não modifica snapshots anteriores |
| Payment | Cenários explícitos approve, decline e temporary-failure | Snapshot imutável por revisão; replay por UUID; uma aprovação por revisão; 32 tentativas sem eviction |
| Order | Criação explícita a partir de tentativa aprovada, leitura por Order ou tentativa | Cópia imutável, um Order por tentativa, replay, capacidade 32; não esvazia Cart |
| Recovery | `/checkout/attempts/{attemptId}`, reload, entrada direta e histórico | Somente GET em recuperação; nenhuma criação automática; referências do browser são hints |

Planejado, mas não entregue: persistência, autenticação/autorização, hosting e domínios futuros como Inventory. PostgreSQL é infraestrutura opcional, não uma integração da aplicação. Redis, RabbitMQ, mobile, observabilidade, Terraform e microserviços são oportunidades condicionais, não escopo autorizado. SS-038 é um piloto separado e ainda aguarda aprovação.

### Comportamentos conferidos na implementação

Os caminhos Java abaixo são relativos a `backend/src/main/java/io/github/samska/sandbox/`.

- `catalog/Product.java`: identidade obrigatória, nome/descrição não vazios, preço não negativo (zero permitido), `mediaKey` opcional com slug de até 40 caracteres.
- `cart/Quantity.java` e `cart/Cart.java`: quantidade positiva, proteção de overflow e snapshot sincronizado com itens, total e revisão; mudanças incrementam a revisão. Não inventar estoque nem limite comercial de quantidade.
- `coordination/CatalogCartCoordinator.java`: serialização de add-to-Cart e delete-Product; garantia local aos caminhos coordenados, não distribuída.
- `payment/storage/InMemoryPaymentStore.java`: replay antes de novo snapshot/capacidade; conflito se o mesmo UUID muda revisão/cenário; captura sob lock Payment → Cart; aprovação indexada pela revisão.
- `order/storage/InMemoryOrderStore.java`: replay antes de capacidade; aprovação consultada pelo contrato `PaymentAttempts`; lock Order → Payment, cópia dos valores e ausência de mutação do Cart.
- `web/src/App.tsx` e `web/src/journey/routes.ts`: seleção por pathname/History API, sem biblioteca de router.
- `web/src/catalog/Catalog.tsx`: concentra carregamento, Cart, navegação, Payment, Order, recuperação, refs de operação e guards contra respostas obsoletas. Serve de referência para caracterização do protocolo; não será a base de extração de hooks da implementação nova.
- `web/e2e/first-order.spec.ts`: suíte real com sucesso e recusa, contagem de POSTs, confirmação congelada, reload/entrada direta/histórico e foco/teclado. Não equivale a cobertura de todas as falhas nem a auditoria completa de acessibilidade.
- `catalog/application/ProductSnapshot.java` e `catalog/storage/InMemoryProductStore.java`: snapshot retém referência a Product mutável. É risco observado estaticamente, não corrupção via HTTP demonstrada. A nova implementação deve encapsular seu estado, sem precisar corrigir previamente a implementação antiga ou reproduzir seu alias interno.
- Preço não tem escala/teto de negócio; `web/src/formatAmount.ts` exibe duas casas sem definir regra monetária backend. O Cart mantém nome/preço capturados na primeira inclusão. Não impor arredondamento, moeda, reprecificação ou limites como correção implícita; decisões monetárias permanecem fora do escopo até aprovação específica.

### Contratos HTTP e integrações

Fonte executável: controllers, DTOs, exception handlers e testes `*ApiTest.java` nos módulos `catalog`, `cart`, `payment` e `order`; consumidores em `web/src/*/*Api.ts`.

| Fronteira | Rotas atuais | Contrato relevante |
| --- | --- | --- |
| Catalog | `GET/POST /api/products`; `GET/PUT/DELETE /api/products/{id}` | PUT completo; Product com `id`, `name`, `description`, `price`, `mediaKey`, `uploadedMediaId`; exclusão em Cart retorna 409 |
| Media | `PUT/DELETE /api/products/{id}/media`; `GET /api/products/{id}/media/{mediaId}` | PUT multipart; só mídia atual; JPEG com `nosniff` e `no-store`; 413 para limites, código distinto para capacidade agregada |
| Cart | `GET /api/cart`; `POST /api/cart/items`; `PATCH/DELETE /api/cart/items/{productId}` | Servidor retorna Cart autoritativo com revisão e cálculos; valores de Product são capturados no Cart |
| Payment | `POST /api/payment-attempts`; `GET /api/payment-attempts/{attemptId}` | Entrada: `attemptId`, `cartRevision`, `scenario` exatamente `approve`, `decline` ou `temporary-failure`; cliente não escolhe itens/preços; 201 criação/200 replay; 409 conflitos; 503 capacidade |
| Order | `POST /api/orders`; `GET /api/orders/{orderId}`; `GET /api/orders/payment-attempts/{paymentAttemptId}` | Entrada só `paymentAttemptId`; 201 criação/200 replay; 409 não aprovado; 503 capacidade |
| Saúde | `GET /actuator/health` | Sem detalhes sensíveis; não comprova integração PostgreSQL |

UUID inválido e corpo inválido têm tratamento 400; ausências 404. Em recovery, dois 404 não provam restart nem sucesso de uma operação incerta. Códigos de erro de Payment/Order fazem parte do comportamento consumido pelo frontend; não normalizá-los silenciosamente.

Os adaptadores Cart/Payment/Order validam a forma das respostas estritamente; até um campo aditivo pode exigir alteração de consumidor. Paridade inclui formatos, tipos, rotas, status e códigos, não apenas o caminho feliz.

Integrações atuais: browser → adaptadores feature-local → `/api` via proxy de desenvolvimento Vite → Spring Boot. Não há provedor de pagamento, banco conectado, fila, serviço externo ou autenticação. GitHub Actions, CodeQL e GitGuardian são ferramentas de entrega/segurança, não integrações de negócio. O build estático não estabelece proxy ou rotas de produção.

## Arquitetura e decisões antigas

### Proposta de base preservada

- Backend proposto: novo monólito modular Java 25 / Spring Boot 4.1.1, módulos Catalog, Cart, Payment e Order e coordenação explícita Catalog/Cart; preservar responsabilidades/garantias, não classes ou stores atuais.
- Dependências direcionais: Cart → Catalog; Payment → Cart; Order → Payment. Coordenação Catalog/Cart explícita; não introduzir ciclos ou lock inverso.
- Frontend proposto: implementação nova em React 19 / TypeScript / Vite / Tailwind v4, organizada por capacidade, com adaptadores tipados e protocolo de jornada explícito. Não extrair e renomear o contêiner antigo como substituto de reconstrução.
- Ferramentas: Maven Wrapper, npm lockfile, JUnit/MockMvc, Vitest/RTL, Playwright Chromium e CI existente.

| Instrução/decisão | Tratamento proposto | Justificativa |
| --- | --- | --- |
| AGENTS e governança humana | Preservar | Aprovação, proveniência da evidência, segurança e revisão continuam necessárias |
| ADR 0001 e princípios | Preservar | Nenhuma evidência exige serviços distribuídos |
| ADR 0002 (Tailwind v4) | Preservar | Não há necessidade demonstrada de troca de styling |
| ADR 0003/0004 (mídia) | Preservar supersessão existente | Não ressuscitar a proibição antiga de upload |
| ADR 0005–0007 | Preservar | Atomicidade, replay e recovery são contratos de negócio/UX |
| Checkout editável | Preservar decisão do proprietário | Não voltar ao antigo Checkout read-only ou criar identidade/backend Checkout |
| Learning journal | Preservar formato atual não bloqueante | Não migrar histórico em massa nem introduzir quizzes como gates |
| SS-035 cancelado | Não reutilizar propostas rejeitadas | Handoff proíbe reutilizar o trabalho não entregue da PR #60 |
| Instruções de branches/PR | Exceção local limitada solicitada | `rebuild/maestri` abriga planejamento; PR e merge continuam exigindo autorização explícita |
| Documentação com estados antigos | Revisar pontualmente após aprovação | Corrigir atualidade sem reescrever evidência histórica |

Inconsistências já observadas: `docs/LOCAL-DEVELOPMENT.md` declara Windows não suportado pelo launcher, mas o handoff registra verificação anterior em Git Bash/Windows; `docs/PRODUCT.md` ainda usa futuro para o marco já publicado; `docs/ARCHITECTURE.md` cita Inventory como candidato v0.1 embora First Order já tenha release. São divergências documentais a reconciliar, não permissão para alterar runtime ou trazer Inventory. A versão Node instalada nesta sessão satisfaz o range, mas não é o patch selecionado no `.nvmrc`.

Precisão para P2: a evidência histórica de launcher Windows é a manutenção #50/PR #51, não a execução Playwright SS-042; decidir se o launcher é suportado em Windows Git Bash. Inventory também aparece como tema v0.5 no Roadmap: reconciliar a intenção entre os documentos, sem concluir que o candidato antigo constitui compromisso atual.

Também foram conferidos o exemplo HTTP de Local Development que omite `description` obrigatória e a descrição de CI em `docs/GITHUB.md` que omite Browser E2E. Node 24.21.0 é aceito pelo range nesta descoberta; a baseline futura deve registrar a versão efetiva e a diferença para CI/`.nvmrc`, sem downgrade automático. O teste concorrente `InMemoryOrderStoreTest#serializesConcurrentSameAttemptIncludingARequestHeldInPaymentLookup` inicia a segunda thread antes de liberar a primeira, mas não comprova que houve disputa: reforço do teste só se a fatia aprovada tocar essa garantia, sem alegar corrida de produção demonstrada.

### Hipóteses, não requisitos aprovados

1. Preservar escopo funcional atual e contratos observáveis, salvo desvios aprovados; não exigir reprodução de estrutura interna, bugs ou composição visual pixel a pixel.
2. Manter stack reduz variáveis durante a reconstrução, mas não obriga reutilizar implementação de domínio, componentes ou protocolos antigos.
3. Redesign visual, idioma, moeda, autenticação e persistência continuam sem autorização implícita. Reconstrução do zero já é a intenção explícita, não uma dúvida em aberto.

O plano executivo revisado a seguir substitui integralmente a antiga proposta de refatoração P0–P7, preservada no histórico Git em `0fad2be`. Não executar aquele backlog.

## Histórico rejeitado — não executar

O conteúdo abaixo é a proposta anterior, mantida apenas para rastrear a decisão recusada. Não constitui recomendação vigente, autorização ou backlog ativo. Para todas as entregas e decisões, usar exclusivamente [RECONSTRUCTION.md](RECONSTRUCTION.md).

### Antigo escopo recomendado e transição

**Recomendação:** reconstrução incremental com paridade funcional. Manter backend e contratos testados; reconstruir a composição frontend e a documentação em fatias pequenas. Não criar uma aplicação paralela completa nem apagar diretórios existentes. Uma reescrita total tem custo e risco de perda de contratos sem benefício demonstrado nesta descoberta.

1. Aprovar objetivos, paridade, limites e primeira fatia.
2. Criar os work items após aprovação, com handoff e metadados canônicos; só então atribuir SS IDs. Os códigos P0–P7 abaixo são apenas referências deste plano.
3. Fixar testes de caracterização antes das extrações; não trocar comportamento e estrutura no mesmo lote.
4. Extrair uma responsabilidade de cada vez mantendo rotas, respostas e comportamento observável. O código antigo só sai quando sua responsabilidade estiver coberta e substituída.
5. Rever cada diff independentemente, executar os gates proporcionais e obter Human Verification exigida antes de commit de alterações observáveis.
6. Solicitar autorização separada para cada PR e merge. Sem autorização, manter branch de trabalho; não alterar `main` nem o checkout original.
7. Rollback por fatia: interromper e corrigir a branch ou propor revert de um commit próprio revisável; nunca reset/force push, perda de trabalho alheio ou modificação do checkout original. Não há migração de dados persistidos nesta proposta.

### Antigo backlog proposto

Cada linha é uma entrega pequena; itens maiores devem ser subdivididos no planejamento da Issue. Nenhum está em Build.

| Item | Objetivo e arquivos previstos | Dependências | Critérios de aceite e verificação | Autor / revisor |
| --- | --- | --- | --- | --- |
| P0 — contrato da reconstrução | Aprovar objetivo, paridade, não objetivos e registro de decisões em docs/rebuild | Decisão do proprietário | Escopo e primeira fatia explícitos; registrar alias Product e decisões monetárias como fora do escopo até aprovação própria; Issues sem duplicação e IDs só na criação; atualizar PROJECT_HANDOFF com estado aprovado/pausado e próximo passo | Orquestrador / proprietário, com consultoria Arquitetura e Qualidade |
| P1 — baseline e mapa de contratos | Produzir `docs/rebuild/PARITY.md`: jornada × invariante × teste/observação × resultado × lacuna; apenas lacunas justificadas em testes | P0 e término explícito da fase somente leitura | Executar E2E baseline como primeiro passo deste item e registrar SHA/ambiente/resultado; não existe E2E atual desta descoberta; repetir backend/frontend; matriz revisada e aprovada cobrindo dinheiro/revisão, snapshots, replay/aprovação, Order único, recovery GET-only e add/delete; fixar caracterização antes de extrações | Qualidade após autorização de escrita / Arquitetura |
| P2 — documentação coerente | Reconciliar os trechos atuais de Product/Architecture/Local Development sem alterar decisões históricas | P0 | Marco atual e limites Windows descritos com evidência; Markdown/links passam; nenhuma capacidade nova declarada | Orquestrador / Qualidade |
| P3 — Cart e composição | Extrair estado/operações de Cart de Catalog para unidade feature-local coesa, preservando guards e ownership único | P1 | Resposta do servidor continua única fonte; drawer e Checkout compartilham dados; quantidade/total/foco/erros preservados; suites e jornada passam; gates de contratos e Human Verification abaixo | Arquitetura como autor técnico / Qualidade |
| P4 — recovery da jornada | Extrair somente reads Order → Payment e estado de recovery; antes, isolar o protocolo compartilhado de guards conforme fronteira abaixo | P3 | GET-only em reload/direct/history; pending guards síncronos e identidade/geração mantidos em um único owner; falhas de Cart/Catalog independentes; respostas obsoletas não habilitam ações; gates de contratos e Human Verification abaixo | Arquitetura / Qualidade |
| P5 — comandos Payment/Order | Mover comandos explícitos para o mesmo owner do protocolo, separando apresentação e reads; não criar framework genérico | P4 | UUID/revisão/replay e reconciliação preservados; aprovação sem Order, Order sem limpar Cart; testes de double-click/resposta incerta/409; E2E sem POST extra; nenhum guard duplicado; gates de contratos e Human Verification abaixo | Arquitetura / Qualidade |
| P6 — opcional, superfícies/Admin | Somente investigar e propor simplificação quando houver duplicação concreta; nenhuma refatoração Admin identificada como necessária nesta descoberta | Evidência específica e aprovação opt-in; não é consequência automática de P5 | Subfatia aprovada com problema demonstrado; formulários/mídia conservam sucesso parcial e retry sem duplicar Product; mesma navegação/acessibilidade; sem redesign; gates de contratos e Human Verification abaixo | Arquitetura ou futuro Frontend / Qualidade |
| P7 — aceite da reconstrução | Verificação integrada, documentação/handoff/learning pertinentes e guia de revisão humana | P2–P5; P6 somente se aprovado | Paridade da matriz, suites verdes no SHA entregue, verificação humana representativa; contratos preservados; pendências fora do escopo explicitadas; atualizar PROJECT_HANDOFF; PR/merge só sob autorização | Orquestrador / Qualidade + proprietário |

**Critérios obrigatórios de cada P3–P6:** rotas, status, corpos, códigos HTTP e tipos/validações dos adaptadores permanecem inalterados; diff de API/adapter vazio ou mudança aprovada separadamente. Classificar Human Verification por fatia; quando exigida, roteiro representativo, resultado efetivamente relatado e registro antes de commit/PR. Para uma extração puramente interna classificada Not applicable, documentar a justificativa, sem dispensar revisão independente e testes. Não afrouxar asserts para manter suite verde.

Cada fatia referencia as linhas afetadas da matriz P1; P7 aceita paridade por essa matriz, não por contagem de testes. Reaproveitar testes existentes de caracterização quando suficientes; fechar lacunas dos invariantes afetados antes da extração. Se a proteção concorrente for alterada, exigir disputa observável e verificar que a caracterização detecta a proteção removida; não impor mutation testing universal. Mudança necessária de API, status, dados ou persistência interrompe a fatia para aprovação separada. No roteiro humano solicitar browser/viewport e registrar somente informações efetivamente fornecidas, sem inventar detalhes omitidos.

**Fronteira P4/P5:** `lookupTokensRef`, gerações, refs de operação e pending guards são protocolo único compartilhado entre reads e comandos. P4 começa por encapsular essas mesmas instâncias numa unidade pequena feature-local de journey, mantida durante o ciclo de vida do contêiner atual; os comandos ainda em Catalog passam a usar essa unidade, sem segundo estado/guard. Só então move os reads, mantendo seu acesso ao mesmo owner. P5 move os comandos para esse owner e remove a ponte temporária. Se a caracterização mostrar que essa separação exige duplicação, P4 para e retorna proposta de subdivisão/replanejamento; não considera recovery concluído com guards órfãos nem funde silenciosamente as entregas.

Revisão do backend nesta sequência é de compatibilidade e fronteiras; não inclui sua reescrita. Uma nova fatia backend exige problema concreto, escopo e aprovação, não apenas disponibilidade de um agente.

### Riscos e gates do plano anterior

| Risco | Evidência exigida antes de aceitar a fatia |
| --- | --- |
| Duplicação de Payment/Order ou confirmação incorreta | Testes de replay/conflito, uncertain-response e pending/stale guards; E2E contando POSTs |
| Perder snapshot ou alterar valores congelados | Unit/API/component tests e jornada real com edição posterior do Cart |
| Mudar contratos ou concorrência | Testes de handlers/DTOs, capacidade e interleavings controlados; revisão de direção de lock |
| Regressão de upload/Admin | Rejeição sem mutação, limites, mídia atual, sucesso parcial, retry e confirmação de exclusão; Human Verification manual com arquivo sintético ou teste browser adicional aprovado, pois os dois E2E atuais não cobrem upload |
| Perder teclado/foco/layout | RTL para semântica; Playwright para foco/teclado; observação humana de responsividade, foco visível e anúncios quando pertinentes |
| Evidência enganosa | Separar Agent, Human e CI; registrar comando, SHA, resultado e omissões; não marcar cenário não executado como passado |
| Colisão de servidores/Cart global | Um executor de runtime/E2E por vez; backend exclusivo e portas 8080/5173; recusar owner existente, nunca encerrá-lo |
| Exposição indevida | Somente dados sintéticos e uso local; sem hosting, credenciais ou pagamento real |

Gates comuns: Maven verify, frontend typecheck/test/build; E2E quando jornada/rotas/orquestração mudarem; Markdown/links/diff nas docs; CI e segurança no head exato quando houver PR autorizada. Não adicionar percentuais de cobertura ou frameworks sem necessidade. Human Verification não é substituída por Playwright nem pela autorização ampla de commit/push.

Gate documental completo pré-PR: markdownlint com configuração do repositório, lychee offline incluindo fragments, EditorConfig e `docker compose config --quiet` com `POSTGRES_PASSWORD` sintético apenas no ambiente (sem arquivo/serviço/volume). Se houver PR autorizada, validar os doze campos canônicos do PR Handoff e seu heading conforme workflow/template. Required checks seguem documentados como diferidos; não confundir CI histórica com verificação do novo SHA. Ferramenta indisponível implica lacuna declarada, não instalação ou CI alegada silenciosamente.

### Coordenação anterior (substituída)

- Orquestrador: único escritor dos documentos desta fase, integrador, verificador dos relatos, dono do registro de decisões e das operações Git.
- Arquitetura: descoberta somente leitura nesta fase; futuro desenho/autor técnico de uma fatia por vez.
- Qualidade: análise somente leitura nesta fase; revisão independente do autor e plano/testes de risco. Sua autoria de P1 só começa após aprovação e término explícito desta restrição; Arquitetura revisa, sem autoaprovação.
- Máximo inicial: dois especialistas além do Orquestrador. Os terminais Maestri são a comunicação real; nenhum subagente interno substitui essa equipe.
- Futuro agente Frontend/Backend/Segurança só se a fatia exigir especialização e houver decisão de ampliar ou substituir um papel; não recrutar preventivamente.
- Nesta fase todos compartilham a worktree, mas só o Orquestrador escreve. Futuras escritas paralelas exigem branches e worktrees distintas, originadas do checkpoint aprovado; nunca dois autores sobre o mesmo arquivo na worktree compartilhada.
- Integração de branches exige autorização de merge. Alternativa inicial recomendada: execução serial na branch de trabalho, revisão somente leitura em paralelo, sem branches adicionais desnecessárias.
- Registro futuro: Issue Handoff para cada entrega, revisão com achados e evidência, PR Handoff somente quando autorizado, snapshot do projeto nas transições materiais. Learning record quando o trabalho aprovado produzir decisão/lição material; ADR novo somente para decisão durável realmente alterada.

### Perguntas anteriores (substituídas)

1. Aprova a reconstrução incremental com paridade ou deseja uma reescrita integral? Qual problema principal quer resolver: manutenção, UX, aprendizagem ou outro?
2. Confirma preservar stack, rotas/APIs, capacidades atuais, dados em memória e operação local? Qualquer remoção ou mudança precisa ser enumerada.
3. Há redesign visual, idioma ou nova jornada desejada? Na ausência de aprovação explícita, ficam fora do escopo.
4. Aprova iniciar por P1 e P2 após P0, mantendo SS-038 separado e sem infraestrutura nova?
5. Distribuição de modelos resolvida pelo proprietário: Orquestrador GPT-6.1 Sol Medium; especialistas Go selecionados pelo Orquestrador. O teste inicial preserva a limitação de effort da época; configuração posterior e evidência em [MODELS.md](MODELS.md).

## Próximo passo vigente

**Parar e aguardar aprovação do plano revisado em RECONSTRUCTION.md.** Não executar o backlog anterior nem a nova reconstrução, não abrir PR, não fazer merge, não remover a implementação existente. Commits/pushes desta fase contêm apenas planejamento/evidências, sem indicar aprovação.
