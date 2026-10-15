# Reconstrução do zero — plano executivo revisado

## Estado, intenção e limites

**Revisão 2 — R1 approved / In Build — 2026-10-15.** O proprietário aprovou a direção do zero, stack/comportamentos e preparação diretamente necessária + R1 (criar/listar/detalhar Product novo), mantendo textos/idioma e UI funcional/acessível. Não aprovou cutover, remoção, R2+, persistência, auth, hosting, PR ou merge. O plano anterior `0fad2be` foi rejeitado e seu backlog P0–P7 substituído. [Diagnóstico](PLAN.md#diagnóstico-do-produto), [evidências](VERIFICATION.md) e histórico Git preservados. Trabalho ativo: [SS-043 / #80](https://github.com/Samska/samska-sandbox/issues/80), [handoff R1](R1.md).

- Escrever novos domínio, serviços, adaptadores HTTP, interface e protocolo de jornada. Código existente é referência consultável de requisitos/contratos e comportamento, não base para copiar, mover, renomear ou extrair componentes como entrega reconstruída.
- Podem permanecer licença, documentação/ADRs, build wrappers, manifests/lockfile, assets com atribuição válida, ferramentas, workflows e testes de comportamento úteis. Essa reutilização de suporte não equivale a reutilizar a aplicação.
- Não é clean-room jurídico: os autores podem consultar o código atual. Testes estruturais acoplados à implementação antiga não prescrevem a nova estrutura.
- Nesta fase editar somente planejamento/handoff. Não criar scaffolds, endpoints, scripts ou tests de implementação; não apagar/mover código antigo nem rodar processos novos.
- A restrição de somente planejamento acima descrevia a revisão; após aprovação do proprietário, implementação/testes/execução candidatos R1 e preparação necessária estão autorizados. A proibição de cutover/remoção permanece. Interromper após entregar R1 para validação humana antes de commit de comportamento, PR ou próxima entrega.
- Referência funcional congelada: `ec92cd35073ea3b52afa13a740f75fb0788f6c2b` (mesmo código da base documental `0fad2be`). Cada linha da matriz registra SHA/oráculo; mudança posterior na referência exige revisão explícita, não atualização silenciosa das expectativas. Nenhum teste já executado é prova do futuro código novo.
- Trabalho futuro na worktree `C:\Users\Samuel\Desktop\samska-sandbox-rebuild`, branch `rebuild/maestri`, mesmo repositório Samska/samska-sandbox. Checkout original intocado. PRs e merges exigem autorização explícita, inclusive integração de branches de especialistas.

## 1. Escopo funcional e rastreabilidade

Os identificadores RF abaixo são locais ao plano, não SS IDs reservados. Referências Java usam a raiz `backend/src/main/java/io/github/samska/sandbox/`.

| ID | Reconstruir (já implementado na referência) | Regra/contrato recomendado para preservação | Fontes de requisito e evidência |
| --- | --- | --- | --- |
| RF1 | Catalog e Market: listar, ver detalhe, criar, atualizar e excluir Product | Nome/descrição obrigatórios, preço não negativo incluindo zero, mediaKey opcional; PUT completo preserva upload; não excluir Product no Cart (409); contratos JSON/status atuais | docs/PRODUCT.md; catalog/Product.java; catalog/api/*; coordination/CatalogCartCoordinator.java; ProductApiTest; web/src/catalog e admin |
| RF2 | Mídia: upload/substituição/remoção e exibição | Um JPEG por Product; assinatura/dimensões/re-encoding, rejeição sem mutação, ID atual, precedência upload → curated → fallback; 3 MiB multipart, 2 MiB input/output, 2048 px/lado, 4M pixels e 32 MiB agregado; nosniff/no-store | ADR 0003/0004; docs/SECURITY.md; catalog/application/MediaLimits.java e ProductMediaNormalizer.java; testes normalizer/store/media/API |
| RF3 | Admin: lista, busca local por nome, formulários e exclusão confirmada | Rotas atuais; sucesso parcial entre Product e mídia, retry/reconciliação sem duplicar criação; navegação não é autorização | docs/PRODUCT.md; web/src/admin/*; testes AdminProductCreate/Edit/Products |
| RF4 | Cart único, drawer e Checkout editável | Quantidades positivas/overflow, cálculo BigDecimal no servidor, resposta atômica com revisão; nome/preço da primeira inclusão; não criar recurso backend Checkout; exclusão coordenada com add | ADR 0001; docs/ARCHITECTURE.md; cart/Cart.java, Quantity.java e CartItem.java; CartApiTest/CartTest/CoordinatorTest; web/src/cart e checkout |
| RF5 | Payment simulado e resultado | Cenários approve/decline/temporary-failure; UUID + revisão, snapshot imutável; replay antes de capacidade, conflito de payload, uma aprovação por revisão, 32 tentativas sem eviction; approval não cria Order | ADR 0005; payment/api/* e storage/InMemoryPaymentStore.java; PaymentApiTest e store tests |
| RF6 | Order explícito e confirmação | Somente de tentativa aprovada; um Order/attempt, cópia imutável, replay antes de capacidade, limite 32; não limpar Cart; lookup por Order e tentativa | ADR 0006; order/api/* e storage/InMemoryOrderStore.java; OrderApiTest/store tests e FirstOrderJourneyApiTest |
| RF7 | Jornada recuperável por URL | `/checkout` e `/checkout/attempts/{UUID}`; recovery só GET, Order → Payment após 404; pending síncrono, identidade/geração contra stale responses, nenhuma ação automática após reload/history; referência de sessão só hint; dois 404 não provam restart; abandono explícito só no browser | ADR 0007; web/src/journey, Catalog.tsx e RecoveryFlow.test.tsx; web/e2e/first-order.spec.ts |
| RF8 | Acessibilidade e feedback | Loading/pending/success/error, headings e foco coerentes, drawer com contenção/Escape/retorno, teclado, responsive, rota desconhecida; nenhuma alegação de auditoria completa baseada em jsdom | docs/TESTING.md; App.tsx; CartDrawer.tsx/test; ProductDetail.tsx; E2E e handoff SS-039/042 |

Reproduzir comportamento aprovado, não defeitos internos: não conservar alias mutável de Product em leituras do novo store; usar valores/cópias com ownership claro. Não inventar escala, moeda, arredondamento, reprecificação ou teto de preço. Interfaces HTTP da tabela em PLAN.md são o ponto de partida; especificar corpos/códigos exatos antes da fatia, pois adaptadores atuais validam chaves estritamente.

**Ideias futuras, fora do escopo:** persistência de negócio/PostgreSQL conectado, auth/authz, hosting, Inventory/estoque, clientes, entregas, notificações, mobile, filas/cache, observabilidade distribuída, cloud/IaC, microserviços e SS-038. PostgreSQL Compose continua opcional e desconectado. O papel Backend cobre persistência quando aprovada; sua existência não autoriza banco agora. Dados sintéticos, pagamentos simulados e uso local são limites preservados.

## 2. Arquitetura e stack propostas

| Área | Proposta e justificativa |
| --- | --- |
| Backend | Nova implementação de monólito modular Java 25 / Spring Boot 4.1.1, mesma base de dependências/Maven Wrapper. Requisitos atuais não justificam linguagem/framework/serviços novos |
| Limites | Catalog, Cart, Payment, Order; coordenação explícita de add/delete. Dependência Order → Payment → Cart → Catalog via contratos públicos, nunca internals/stores de outro módulo |
| Domínio/estado | Domínio novo independente de Spring/HTTP; valores e snapshots imutáveis/cópias; serviços por capacidade; stores novos em memória, consistência local com sincronização e direção de lock revisadas. Não reutilizar stores/agregados legados |
| Dinheiro/protocolo | Cart novo é autoridade dos cálculos; Payment captura revisão sob garantia atômica; Order copia tentativa aprovada. Ownership e atomicidade dos ADRs mantidos, algoritmo/classes podem ser redesenhados e testados |
| Frontend | React 19 / TypeScript / Vite / Tailwind v4. Nova composição por superfícies/capacidades, adapters novos, estado Cart único e protocolo explícito por tentativa; apresentação não concentra todo o workflow num novo Catalog gigante |
| Navegação | Manter rotas e History API sem biblioteca nova inicialmente; resultado recuperável independente de Catálogo/Cart vivos. Uma dependência de router/state exige necessidade demonstrada e aprovação separada |
| Testes/CI | JUnit/MockMvc, Vitest/RTL e Playwright Chromium existentes. Reaproveitar ferramentas e oráculos de contrato, não exigir classes/test counts antigos; ampliar cenários só conforme risco |
| Setup | Manter Node range e npm atuais, sem upgrade global. Nenhum banco, Docker, segredo ou conta nova para rodar aplicação; manter pins e controles CI existentes |

ADRs aceitos mantêm autoridade sobre decisões de produto/ownership. Não reescrever sua justificativa histórica. Criar ADR Proposed se o desenho revisado mudar decisão durável; aprovação humana antes de aceitar tal mudança. A coexistência temporária e a troca de implementação são registradas no plano/Issue; avaliar ADR para o desenho final, sem transformar este plano em ADR aceito.

## 3. Transição por substituição, não extração

### Candidato parcial, limitado no tempo e no escopo

Proposta de organização **a implementar somente após aprovação**:

- Backend novo em namespace irmão `backend/src/main/java/io/github/samska/commerce/`, com testes novos em `backend/src/test/java/io/github/samska/commerce/`. Nova entrada Spring Boot faz scan somente da raiz nova; a entrada antiga em `io.github.samska.sandbox` não a descobre automaticamente. Um perfil Maven `rebuild` seleciona explicitamente a nova main class no plugin existente, com saída própria `backend/target/rebuild`; o padrão continua selecionando a antiga enquanto houver transição. O build compila/verifica ambos, mas só uma entrada roda por vez. A aplicação candidata não instancia/importa domínio/serviços antigos nem ativa controllers legados. Não é preciso source-set/plugin novo.
- Fixar em R1: entrada nova `io.github.samska.commerce.CommerceApplication`; perfil configura `build.directory` inteiro para `${project.basedir}/target/rebuild` (classes, relatórios e jar, não apenas um subdiretório de reports) e `mainClass` efetiva do spring-boot-maven-plugin. Padrão permanece em `target` com sua main explícita. Verificar path/hash e manifesto `Start-Class` dos dois jars, logs de `spring-boot:run` e beans instanciados; não concluir isolamento por nome do perfil. Testes candidatos usam `@SpringBootTest(classes = CommerceApplication.class)` ou configuração explícita mínima. Não executar `clean` padrão enquanto evidência candidata em target precisar ser preservada.
- Frontend candidato temporário em `web/rebuild/`, mesmo package/lockfile e ferramentas; configuração Vite/TypeScript/test dedicada mínima e explícita, sem importar componentes/hooks/adapters da aplicação antiga. Curated assets podem ser compartilhados sem duplicação, preservando atribuição.
- Uma única execução local de runtime/E2E por vez; candidato usa portas 8080/5173 e recusa ocupação. Não conectar frontend candidato por engano ao backend padrão. Identidade de runtime verificável em marcador de startup e endpoint técnico candidato de identificação, sem dados internos, removido na saída da transição; readiness não aceita apenas um health alheio.
- O marcador técnico é controle transitório de tooling, não contrato de negócio: a Issue R1 deve fixar sua rota/payload e whitelist de endpoints expostos (incluindo health), sem retornar paths, credenciais ou detalhes internos. Os métodos de negócio não implementados ficam ausentes, não redirecionados ao legado.
- Candidato é incompleto e declarado como tal: R1 não representa First Order. Não habilitar rotas fictícias para fingir capacidades ainda não reconstruídas. Não criar novo repo, novo package-lock ou segunda infraestrutura.

### Cutover e owner único

1. Nova capacidade nasce isolada; testes e demo do candidato não escrevem no estado legado. Sem dual-write, sincronização de stores ou fallback de mutação entre versões.
2. Catalog só substitui o atual após reconstruir CRUD **e mídia**, contratos HTTP completos, integração ProductCatalog e coordenação com Cart legado. Antes disso, o runtime padrão continua dono do Catalog antigo.
3. No checkpoint de Catalog, o bootstrap padrão importa explicitamente a configuração do módulo novo e desativa/remove a configuração/controllers/store Catalog antigos na mesma entrega aprovada. O novo namespace é definitivo, não mover classes antigas para ele. Uma ponte temporária do lado legado implementa `ProductCatalog` delegando ao contrato público do Catalog novo; o módulo novo nunca importa `sandbox` para satisfazer a ponte. Revisar coordenação add/delete e wiring de store único. Não manter dois owners de `/api/products`. Pontes não duplicam regras e saem quando Cart novo substituir o consumidor legado.
4. Reconstruir/substituir backend Cart, Payment e Order em sequência, cada um inteiro e compatível com o consumidor ainda legado. Não servir metade dos writes de um agregado por store antigo e metade por store novo.
5. Frontend Admin é superfície independente para cutover antecipado quando RF1–RF3 estiverem completos. Market/Cart/Checkout/Payment/Order formam uma jornada com estado compartilhado: desenvolver novas subfatias no candidato e trocar a superfície cliente como unidade coerente após RF4–RF8; não repartir guards/estado entre contêineres antigos/novos.
6. A cada cutover remover código substituído do caminho ativo e área candidata frontend correspondente. Namespace novo backend permanece; bootstrap candidato só conhece módulos novos e cria seu próprio grafo em memória quando selecionado. Na última entrega, a nova entrada torna-se a padrão, a antiga e pontes são removidas, a nova superfície cliente vai para `web/src`, e saem perfil/scripts/configs temporários. Não haverá milestone final com duas aplicações completas mantidas.
7. A aplicação ativa pode conter módulos novos e ainda não reconstruídos durante transição, porém cada capacidade tem um owner. Isso é substituição progressiva de implementação, não aceitação do código antigo como resultado final.

**Wiring escolhido:** configurações de módulo novas separam domínio/serviços, HTTP (`commerce.catalog.api` etc.) e composição/coordenação. No padrão pós-cutover, importar explicitamente somente as configurações novas da capacidade migrada; excluir/remover seus antigos controllers/advice/config/store, sem scan amplo de `commerce` ou de seu bootstrap. No candidato, selecionar grafo exclusivamente novo. Teste por runtime lista os mappings/beans e exige exatamente um controller por método/rota, um store e a implementação de deleção esperada. Anotar tudo indiscriminadamente com `@Profile("rebuild")` não serve: controllers novos também precisam funcionar no padrão após o cutover.

**Escolha R4: Catalog isolado com ponte de deleção, não ciclo R4↔R5.** A ponte de leitura ProductCatalog é insuficiente: o coordenador legado também usa ProductApplicationService em delete. R4 substitui essa ligação por delegação ao serviço novo. O controller Catalog novo depende de contrato estreito de deleção configurável pelo bootstrap: no candidato sem Cart, deleção local; no padrão com Cart legado, adapter do lado legado executa existência/check Cart/delete novo sob **o mesmo lock/instância de coordenação usado pelo add-to-Cart legado**. Não pode conferir Cart fora do lock nem chamar store Catalog antigo. Os dois caminhos entram no mesmo protocolo, com 409 e nenhuma mutação na recusa. Gate: testes determinísticos dos dois interleavings add/delete, exclusão livre/ausente, wiring de controller → coordenação e snapshot/preço do Cart preservados. Em R5, coordenação nova Catalog/Cart substitui a ponte. Se essa composição não puder ser mantida estreita, parar e pedir cutover conjunto Catalog+Cart antes de implementar a troca.

As pontes não se limitam a interfaces existentes: `PaymentApplicationService` referencia concretamente `CartApplicationService`, e Order usa `PaymentAttempts`/tipos antigos. Nos cutovers Cart/Payment, manter apenas facades/conversores de compatibilidade do lado legado quando necessários à compilação e ao contrato do consumidor, delegando ao único serviço/store novo e traduzindo snapshots/erros. Elas não podem reter agregado/store/regra antiga nem chamar em direção inversa do módulo novo ao legado. Testar sucesso e erro dos consumidores; remover cada facade/conversor quando seu consumidor for reconstruído. Se a ponte não for estreita ou mantiver regra duplicada, propor cutover conjunto das capacidades, não improvisar alteração silenciosa.

Cada reinício perde o estado em memória, comportamento atual e limite aceito localmente. Não migrar Cart/Payment/Order entre processos nem prometer continuidade de tentativas durante cutover: parar runtime próprio, avisar reset, reiniciar com fixtures sintéticas. URL antiga sem registro retorna ausência honesta, não recria operações. Rodar comparação legado/candidato sequencialmente com fixtures equivalentes, nunca nos dados reais de outra sessão.

Antes de cada troca, registrar runbook com main class/perfil, rotas/owner/stores ativos, dependentes e checkpoint anterior. A remoção é proposta para o mesmo checkpoint de substituição, **somente após** paridade da capacidade, revisão, Human Verification e autorização explícita da remoção daquela capacidade; nesta revisão nenhuma remoção está autorizada. Janela de observação proposta: uma sessão local dedicada aos cenários de sucesso/recusa/recovery/concorrência afetados, encerrada com resultado relatado, não um período de hosting. Se o proprietário quiser manter rollback em arquivos além do checkpoint Git, revisar o prazo e impedir duplicação permanente antes de Build.

Rollback: manter checkpoint Git próprio por capacidade; interromper ou propor revert revisável do próprio commit, sem reset/force push nem tocar checkout original. Rollback também reinicia memória, não restaura registros. Se a transição exigir duplicação duradoura, terceiro runtime, compartilhamento indevido de estado ou alteração de contrato, parar e revisar o plano.

## 4. Backlog revisado

R0–R10 são referências do plano, não Issues criadas ou SS IDs. Cada linha é subdivisível em tarefas backend/frontend/teste com dono exclusivo e revisões próprias, sem mudar dependências/gates. Só R0 é aprovação; nenhuma implementação autorizada nesta fase.

| Entrega | Dependências | Resultado novo e critérios de aceite | Papéis necessários (em turnos) |
| --- | --- | --- | --- |
| R0 — aprovar baseline de produto e transição | Proprietário | Confirmar RF1–RF8, limites e candidate/cutover; antes de liberar codificação R1, congelar e revisar seu recorte em `docs/rebuild/PARITY.md` com fonte, oráculo, lacuna e SHA; demais linhas podem ficar explicitamente pendentes; registrar desvios; Issues/handoff/IDs só após aprovação | Orquestrador + Arquitetura/Qualidade consultivos |
| R1 — primeiro executável: Product → API → lista | R0 e matriz do recorte R1 congelada/revisada antes de codificar | Novo Product, store em memória, POST/GET coleção/GET por ID, backend candidato e UI nova mínima de criar/listar; fontes/rotas/DTOs descritos abaixo; nenhum import runtime legado; testes novos e demo humana; aceite referencia matriz prévia sem ajustá-la para esconder divergências; ainda sem cutover | Backend, depois Frontend; Qualidade e Revisor em turnos |
| R2 — Catalog CRUD e navegação de produto | R1 | Novo PUT/DELETE, validação/erros atuais, UI de detalhe/lista/busca e formulários novos; caso Product no Cart ainda não reivindicado como pronto antes de R4; nenhum placeholder aceito como comportamento entregue | Backend/Frontend em turnos; Qualidade/Revisor |
| R3 — mídia e fluxos Admin | R2 | JPEG normalizado e todos os limites/headers/atomicidade; curated/fallback; sucesso parcial e retry/reconciliação UI sem duplicar Product; teste servlet real/multipart e humano com imagem sintética; RF1–RF3 no candidato | Backend, Frontend, Qualidade, Revisor em turnos |
| R4 — cutover Catalog/Admin | R3 | Contrato ProductCatalog + add/delete coordenados com Cart legado, inclusive corrida e 409; CI/testes dos consumidores; substituir Catalog canônico e superfície Admin, remover implementações substituídas e candidato correspondente; um owner por identidade/recurso | Backend/Frontend; revisão e execução em turnos |
| R5 — Cart novo | R4 | Novo agregado/store/serviço/API com cálculos, revisão, preço/nome capturado e coordenação; substituir backend Cart por inteiro; nova UI drawer/Checkout no candidato, testes de foco/teclado/erro; consumidores Payment/Order legados continuam compatíveis | Backend/Frontend; Qualidade/Revisor |
| R6 — Payment novo | R5 | Novo store/protocolo e API: replay, conflitos, revisão, approval única, limite e cenários; substituir backend Payment, consumidores Order legados compatíveis; UI candidata explícita e incerteza sem reenvio automático | Backend/Frontend; Qualidade/Revisor |
| R7 — Order novo | R6 | Novo domínio/store/API: approved-only, cópia, replay/capacidade, sem limpar Cart, lookup; substituir backend Order; UI candidata de confirmação explícita e reconciliação | Backend/Frontend; Qualidade/Revisor |
| R8 — recovery novo e cutover cliente | R7 | Nova coordenação íntegra de tentativa, guards, URL/storage/history/abandono; RF7–RF8, independente de live Cart/Catalog; E2E conta POSTs em reload/direct/history e falhas; trocar superfície cliente, remover antiga e candidato/launchers transitórios | Frontend + Qualidade; Revisor em turno separado |
| R9 — aceite global e encerramento | R8 | Matriz RF1–RF8 completa, todos os owners/runtime reconstruídos, nenhum import/ponte/candidato legado residual; suites, revisão independente, Human Verification e docs/learning/ADRs pertinentes; nenhuma alegação baseada só em contagem; atualizar handoff | Qualidade/Revisor e Orquestrador |
| R10 — CI/setup, somente sob necessidade | Antes da entrega afetada | Ajuste mínimo do workflow existente para verificar candidato + padrão durante coexistência, isolamento de artefatos e retirada final dos comandos temporários; preservar pins/permissões/falha vermelha; aprovar escopo antes de editar | Infraestrutura/CI + Revisor; Qualidade executa em outro turno |

R10 é suporte condicional e não motivo para adiar testes do candidato. Antes de PR de R1, incluir execução de verificações candidatas no CI existente se os comandos atuais não as cobrirem; nenhuma PR é aberta sem autorização. Não publicar candidato incompleto como nova release ou alegar paridade global antes de R9.

## 5. Primeira entrega executável — R1

**Proposta, comandos ainda inexistentes:** uma fatia nova de Catalog observável ponta a ponta, não só health/scaffold. Domínio Product e store próprios; DTOs atuais de Product com `mediaKey` nullable preservado conforme entrada e `uploadedMediaId: null` enquanto upload estiver ausente; POST 201 + Location, GET coleção e GET identidade 200/404, entradas inválidas 400. UI mínima `/` com criar/listar/abrir Product, feedback acessível; upload, Cart, Payment, Order e Admin completo ainda ausentes e declarados no candidato. Fixtures só sintéticas.

Arquivos candidatos previstos: `backend/pom.xml` (perfil/saída/main class), `backend/src/main/java/io/github/samska/commerce/`, testes correspondentes, `web/rebuild/`, configs/scripts de execução/checagem candidatos em `web/package.json`, e roteiro de R1 em docs/rebuild. Build/tooling pode mudar apenas para suportar essa fatia; sem dependência nova prevista. Qualidade escreve somente testes/fixtures designados, não as mesmas fontes do implementador.

Execução proposta em Windows, após R1 implementado/revisado:

```text
Terminal 1 (worktree/backend):
  .\mvnw.cmd -Prebuild --batch-mode --no-transfer-progress spring-boot:run
Terminal 2 (worktree/web):
  npm ci --ignore-scripts
  npm run dev:rebuild -- --host 127.0.0.1 --port 5173 --strictPort
Browser:
  http://127.0.0.1:5173/
```

Não executar junto com o padrão nas mesmas portas. R1 deve entregar comando que recuse porta ocupada sem encerrar terceiros, identifique o backend candidato antes de habilitar uso e documente início/parada segura (inclusive Windows), sem presumir que o launcher atual supervisiona o perfil novo. `Ctrl+C` encerra apenas processos próprios; se lifecycle adicional for necessário, Infra/CI propõe escopo mínimo. O nome exato do perfil/scripts pode ser ajustado em Plan da Issue, mas o roteiro real deve ficar reproduzível, não apenas este exemplo.

Verificação proposta:

```text
backend: .\mvnw.cmd -Prebuild --batch-mode --no-transfer-progress verify
backend: .\mvnw.cmd --batch-mode --no-transfer-progress verify
web:     npm run typecheck:rebuild
web:     npm run test:rebuild
web:     npm run build:rebuild
web:     npm run test:e2e:rebuild
web:     npm run typecheck && npm test && npm run build
web:     npm run test:e2e
```

No Git Bash, usar a forma adequada `./mvnw.cmd`; os comandos PowerShell acima não são instruções para copiar literalmente no Bash. O E2E candidato deve supervisionar frontend/backend candidatos com readiness/identidade, um worker, sem reuse de servidor externo; usar Playwright já instalado, sem framework novo. Se Chromium não estiver instalado, informar antes de baixar; não alegar E2E passado. Este plano não executa os comandos propostos.

Executar os E2E **sequencialmente**, parando antes os servidores manuais: primeiro a suíte candidata com seu perfil/identidade e teardown, depois `npm run test:e2e` padrão com seus próprios servidores e sem perfil rebuild. Registrar que esta última iniciou o bootstrap padrão e completou First Order; build/unit tests sozinhos não provam runtime padrão preservado. Se não for possível executar, o critério correspondente fica pendente, não passado/Not applicable.

**Aceite R1:** (1) create de Product válido e seleção visual por ID; (2) vazio/erro de entrada com feedback acessível; (3) 400/404/201/Location e JSON compatíveis, preço zero permitido; (4) dado mantido durante processo e perdido honestamente no restart; (5) verificação de identidade/porta ocupada; (6) diff contém implementação nova sem imports de runtime legado; (7) aplicação padrão/consumidores preservados nesta fase; (8) evidências de testes e revisão independente; (9) proprietário reproduz criação/lista/detalhe e relata resultado antes de commit/PR conforme governança. E2E atual First Order não é esperado passar contra candidato incompleto; continua separado no runtime padrão.

Método do critério (6): registrar inspeção estática reproduzível (por exemplo `rg -n 'io[.]github[.]samska[.]sandbox' backend/src/main/java/io/github/samska/commerce`, sem ocorrências de dependência runtime; no rg, exit 1 significa nenhuma ocorrência) e lista resolvida de imports frontend candidato a partir de seus fontes e configs Vite/TS. Revisor confere imports diretos, FQCN, aliases, imports dinâmicos/reflection/config e grafo de beans; busca textual isolada não prova isolamento. Nenhum import candidato pode resolver para implementação frontend antiga, e nenhuma configuração candidata pode instanciar classe/bean legado. Ferramentas existentes ou script local pequeno do próprio teste, sem dependência/framework adicional. Exceções técnicas só para pontes do lado legado no cutover, nunca para lógica nova importar legado.

## 6. Testes, revisão e validação humana

- Completar matriz de paridade por RF com contrato, invariante, exemplo positivo, recusa, concorrência/recovery quando aplicável, teste/observação e resultado. Usar análise existente; não refazer inventário completo. Distinguir diferença aprovada de regressão e lacuna.
- Definir identidade observável por linha: método/rota, status, campos/tipos, ordenação quando contratual, headers, códigos de erro, limites e concorrência, com SHA congelado e classificação do oráculo (rede/browser ou referência unitária/estrutural). A matriz do recorte R1 deve estar revisada antes de codificá-lo; linhas futuras podem continuar como lacunas explícitas.
- Novos unit/component tests para domínio/serviços/componentes novos. Reutilizar testes black-box HTTP e browser como oráculos, adaptando só bootstrap/fixtures quando justificável; não reduzir assertions para esconder divergência nem transportar dependência de classes antigas.
- Nos cutovers, testes estruturais que importam fontes removidas saem somente com correspondência explícita na matriz para seus novos testes de comportamento; não exigir que classes antigas permaneçam para compilar testes obsoletos. Consumidores ainda legados continuam verificados. Remover teste sem substituição/evidência requer justificativa e revisão, não uma redução de cobertura disfarçada de nova arquitetura.
- Comparar contratos de referência e candidato sequencialmente com fixtures determinísticas (não IDs aleatórios iguais à força). Normalizar apenas valores explicitamente não determinísticos, jamais totais, revisão, status ou códigos.
- Em todo cutover, executar testes novos, consumidores não substituídos, jornada real do runtime composto e cenários de concorrência/erro afetados. Mídia exige servlet/browser real para limites multipart; não alegar que MockMvc/jsdom provam isso.
- Payment/Order/recovery exigem capacidade/replay antes de limite, uma aprovação/Order, snapshot congelado, respostas perdidas/atrasadas, pending síncrono e GET-only sem POST extra. Teste de disputa deve demonstrar interleaving relevante; mutation check pontual quando proteção mudar, não universal.
- Revisor independente recebe diff completo, requisitos RF/Issue, comandos/resultados/SHA e limitações; não autorou o código examinado. Achados são corrigidos pelo autor e reexaminados. Orquestrador confere arquivos, diff e saídas, não apenas resumo do especialista.
- Evidência mínima por execução: SHA/checkpoint e estado da árvore (incluindo mudanças locais), referência/oráculo, comandos e exit codes, runtime/main class/perfil/portas, versão das ferramentas e caminhos de relatórios/saídas relevantes. Artefatos só sintéticos, ignorados quando gerados; registrar o resumo rastreável em docs/Issue, não segredos ou dumps indiscriminados.
- Human Verification por fatia: Required/Not applicable justificado; para R1 e cutovers observáveis, Required antes de commit/PR. Roteiro curto com dados sintéticos, passos, observações de sucesso/recusa/recovery/foco; registrar resultado real, browser/viewport quando fornecidos e omissões, sem inventar evidência.
- CI no head exato quando houver PR autorizada; Agent/Human/CI sempre separados. Required checks seguem diferidos e CI histórico não verifica código novo. Gate docs: markdownlint, lychee incluindo fragments, EditorConfig, diff check, Compose estático se pertinente, PR Handoff canônico. Ausência de ferramenta fica explícita.
- Atualizar documentação, handoff, learning record e ADR quando material, sem apagar rationale histórico. Não exigir estudo/quizzes como gate. Não copiar workflow rejeitado SS-035.

## 7. Equipe, modelos e momento de entrada

Máximo **dois especialistas trabalhando simultaneamente**, além do Orquestrador; terminais Maestri visíveis/conectados, sem subagentes internos. Especialistas não recrutam nem delegam recursivamente. Sessão sem tarefa fica ociosa, não executa investigação paralela. Não criar agora os papéis futuros só para preencher canvas.

| Responsabilidade | Modelo/provider/variant | Momento e justificativa |
| --- | --- | --- |
| Orquestrador | `openai/gpt-6.1-sol#medium` | Sempre: aprovações operacionais, integração, conferência das evidências; ChatGPT Plus já configurado |
| Arquitetura | `opencode-go/kimi-k2.7-code`, Default | Reutilizar terminal atual para RF/contratos/decisões e checkpoints. Contexto técnico já acumulado; não assume autoria de toda implementação |
| Qualidade | `opencode-go/deepseek-v4.1-flash#high` | Reutilizar terminal atual para matriz, testes, execução e evidências; família distinta de Backend. Se autor de teste, Revisor examina seu diff |
| Backend | `opencode-go/kimi-k2.7-code`, Default | Recrutar após aprovação, em R1 e demais fatias backend: domínio/API/stores e futura persistência só se aprovada; modelo focado em código já disponível, papel separado de Arquitetura |
| Frontend | `opencode-go/minimax-m3#thinking` | Recrutar só quando contrato/backend R1 estabilizar; UI nova, acessibilidade e integração. Outra família, variante reflexiva e uso Go; escolha inicial, não benchmark deste projeto |
| Revisor | `opencode-go/deepseek-v4-pro#high` | Recrutar ao existir primeiro diff implementado pronto para revisão (antes de aceite/commit). Reservar capacidade para revisão de risco/contrato, independente do implementador e da execução de testes |
| Infraestrutura/CI | `opencode-go/glm-5.3-flash#high` | Só se perfil/lifecycle/CI da fatia exigir R10 delimitado, potencialmente já R1; modelo Go adequado a tarefas curtas de configuração, sem promover arquitetura por ferramenta |

Novos modelos/variants foram encontrados no catálogo Go nesta revisão; são proposta, não terminais configurados. Antes de qualquer tarefa: `maestri list` para reutilizar papel existente; recrutar com preset OpenCode só se necessário; identificar sessão exata do terminal, selecionar provider/model/variant via API V2 ou `/models`; conferir `session.get` e metadado de um turno curto de confirmação sem tarefa substantiva. Só então delegar. Se não conseguir definir/verificar, informar limitação e parar aquele papel; não cair no default OpenAI. Nome no prompt ou footer isolado não basta. Models.md registra evidência do trio atual. Credenciais/billing não são lidos/expostos/alterados; na cota, aguardar reset, sem fallback pago/OpenAI especialista.

Agenda de dois slots: nesta revisão Arquitetura + Qualidade somente leitura. Em Build, ambos ociosos enquanto Backend e eventualmente Infra executam áreas disjuntas; depois Frontend + Qualidade (contrato já definido); ao revisar, autor encerra escrita e Revisor + Qualidade executam revisão/verificação. Arquitetura entra por consulta no lugar de um slot, não como terceiro trabalhando. Não sobrepor donos de source, testes ou manifests; Orquestrador integra configs compartilhadas em janela exclusiva.

## 8. Delegação, branches e integração

Toda tarefa inclui objetivo, escopo/não objetivos, dependências/checkpoint, RF/Issue, arquivos sob responsabilidade exclusiva, critérios de aceite, comandos/evidências esperados e retorno por Maestri. Enviar só contexto da fatia e links necessários, não transcrições nem novo levantamento amplo.

Preferir implementação serial na `rebuild/maestri` com um escritor por área, sem merges desnecessários. Paralelismo de escrita só em worktrees/branches distintas por entrega, criadas de checkpoint confirmado; paths reservados e dono explícito, sem runtime compartilhado. Orquestrador é o único integrador. Se integração exigir merge/cherry-pick de branches, pedir autorização explícita antes; não interpretar aprovação do plano como autorização de merge. Nenhuma rebase/reset/force para descartar trabalho alheio. Revisão lê diff completo contra checkpoint, não só status limpo.

## 9. Decisões solicitadas ao proprietário

1. Aprova RF1–RF8 como escopo de reconstrução, mantendo contratos/rotas e limites locais/process-local? Reconstrução do zero já está definida; a pergunta é sobre paridade e desvios.
2. Aprova stack atual e candidatos temporários parciais, com cutover por owner/capacidade, sem dois stacks completos mantidos e com reset explícito da memória nos checkpoints?
3. Aprova R1 (criar/listar/detalhar Product novo ponta a ponta) como primeira entrega executável, com perfil/raiz temporária e sem anunciar First Order completo?
4. A aparência atual é referência de capacidades/acessibilidade, não exigência pixel a pixel. Há direção visual/idioma desejada antes de implementar UI? Proposta padrão: mesmos textos/idioma e hierarquia funcional, sem redesign amplo.
5. Mantemos preço sem nova regra monetária, Cart único e limites 32? Se quiser mudar, listar desvios e critérios antes da fatia correspondente. Persistência/auth/hosting continuam fora do escopo salvo novo pedido.
6. Qual deve ser o suporte canônico do launcher em Windows Git Bash? R1 propõe runtime documentado Windows independente do launcher antigo; a divergência histórica não autoriza prometer suporte não verificado.
7. Aprova os gates de remoção por capacidade, com autorização explícita no checkpoint e janela de observação local descrita, preservando rollback em Git? Não se solicita remover código nesta fase.

Modelos, proibição de cobrança extra, limite de dois especialistas e necessidade de aprovação antes de Build já estão definidos, não exigem nova decisão. Nenhum novo especialista foi recrutado nesta revisão.

## Consultas pontuais e decisões propostas do Orquestrador

- Arquitetura sugeriu namespace/rotas shadow no mesmo runtime e Catalog backend completo como primeiro incremento. Foram aproveitados os gates ProductCatalog/consumidores e owner único; não foram adotados prefixos `/api/new`/`/new` nesta proposta. Perfis exclusivos permitem testar as rotas reais, sem grafo legado/candidato simultaneamente ativo, e mantêm a fatia candidata parcial. Alternativa e custos em [ADR 0008 Proposed](../adr/0008-rebuild-with-exclusive-candidate-runtime.md).
- Qualidade sugeriu recorte inicial só GET, congelamento da referência, classificação de oráculos e gates de mídia/dependentes. Foram incorporados os três últimos; R1 propõe POST/GET/UI mínimos para uma fatia vertical verificável sem seed oculto, em vez de Catalog completo ou leitura sem caminho de criação. Todos são propostas, não aprovação do proprietário.
- Não é requisito reproduzir alias mutável interno: preservar comportamento observável de produto não obriga expor referências mutáveis entre módulos. Qualquer mudança de preço/escala/contrato continua sendo desvio que depende de aprovação; nenhuma regra monetária foi adicionada.

## Próximo passo

Executar somente preparação e R1 aprovados, respeitando matriz anterior ao código e checkpoints de revisão/verificação humana. Apresentar R1 e aguardar resultado humano antes de commit de comportamento e qualquer próxima entrega. R2+, cutover, remoção, PR e merge continuam sem autorização.
