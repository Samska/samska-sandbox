# ADR 0008: Rebuild with an Exclusive Partial Candidate Runtime

- Status: Proposed
- Date: 2026-10-15
- Decision makers: Project owner (approval pending); Orquestrador with Arquitetura and Qualidade consultation
- Related: [Reconstruction plan](../rebuild/RECONSTRUCTION.md), [ADR 0001](0001-adopt-modular-monolith.md), [ADR 0007](0007-adopt-attempt-addressed-browser-recovery.md)

## Context

The owner rejected the initial refactoring proposal and requested a new implementation using the existing application only as a product, requirement, and behavior reference. The GitHub repository and history remain unchanged. Implementation has not been authorized. Small executable deliveries must not turn into two complete applications maintained indefinitely or mix process-local transactional state.

## Decision

Propose new backend domain/application/API/store implementations in an independent namespace and a new frontend composition, keeping the justified stack and build/test tools. Use one build and explicitly selected backend entry point/runtime at a time, with a temporary Maven candidate profile and frontend candidate root. The existing entry point remains the default during transition. Component scanning and configuration must select exactly the intended graph, never both owners for a resource.

The candidate is partial. It exposes only implemented capabilities at their real contract paths, plus explicitly documented technical readiness/identity endpoints. No automatic fallback, dual-write, store synchronization, or old runtime imports are allowed in new business modules. At each capability cutover, the active standard application uses its new implementation, with temporary legacy-side public-contract bridges only for consumers not yet rebuilt. The candidate runtime never includes those legacy bridges.

Cutover requires the complete capability contract, affected consumers, independent review, verification, human observation, and explicit owner authorization for removing the superseded implementation. Catalog includes media and coordinated Cart deletion before replacement. The final delivery removes the legacy bootstrap/bridges/frontend and candidate-only configuration, leaving one application. Runtime restarts lose process-local data; neither cutover nor rollback restores Payment/Order records.

This proposal does not supersede accepted product/ownership ADRs, authorize persistence/hosting, or permit implementation/removal now. Owner approval and any necessary ADR acceptance remain separate from writing this document.

## Alternatives Considered

- Incremental extraction/refactoring: rejected by the owner; would retain implementation the owner intends to rebuild.
- Shadow routes `/api/new/*` and `/new/*` in one active process: suggested by Arquitetura; fewer runtime switches, but simultaneously active independent graphs, route translation and wrong-owner risks complicate exact contract testing and shared business identity. Not selected in this proposal.
- Two full standalone applications/stacks: unnecessary operational/build duplication and longer migration surface; not selected.
- Big-bang deletion followed by full rewrite: not verifiable in small deliveries and removes the usable reference too early.
- Candidate read-only Catalog first: a smaller alternative suggested by Qualidade; this proposal chooses minimal POST/GET with a small new UI to make the first delivery a useful executable vertical slice without opaque seed dependencies. Full Catalog/media remains a later cutover gate.

## Consequences

Positive: independent new implementations, real URL/contract testing, one runtime owner, capability checkpoints, no new stack or distributed infrastructure. Negative: two bootstraps/configurations temporarily coexist in source, old consumers need narrow bridges, and runtime selection/lifecycle must be tested in Windows and CI. Source isolation is not process security isolation; all tooling remains local and synthetic-data only.

CI must compile/test new and old code and run candidate checks explicitly while it is partial. Readiness must prove identity and refuse occupied ports without terminating their owners. A bounded removal checkpoint prevents candidate scaffolding/bridges from becoming permanent. Current check counts and historical CI are not evidence for reconstructed code.

Concrete proposed wiring: use an independent `io.github.samska.commerce` bootstrap; the Maven candidate profile selects its main class and the entire separate `target/rebuild` build directory. Check both jar `Start-Class` manifests and instantiated beans, not only profile names. Candidate tests select their bootstrap explicitly. At cutover the standard bootstrap imports precise new module/API configurations and excludes old controllers/stores; no broad scan that activates both applications. The selected Catalog cutover includes a legacy-side deletion adapter sharing the exact add/delete coordination lock with legacy Cart, not only a read-only ProductCatalog bridge. If that adapter cannot be narrow, stop for a separately approved joint Catalog/Cart cutover.

## Validation

Before R1 coding, approve the plan and contract matrix for its recut. During R1 verify scanning, selected main, identity, empty/invalid inputs, POST/GET contracts, startup/shutdown and unaffected default runtime. At cutovers verify full capability parities and dependent journeys, confirm one owner, perform representative human checks, and record rollback/reset limits. Revisit this proposal if selection needs extra frameworks, new dependencies, long-lived dual applications, reverse module imports or transaction data migration. This ADR remains Proposed until the owner explicitly accepts it.
