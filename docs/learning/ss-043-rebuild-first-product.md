# SS-043: A New Implementation Behind a Frozen Contract

- Status: Historical — reconstruction closed by owner decision; R1 not integrated
- Work date: 2026-10-15
- Last reviewed: 2026-10-15
- Work item: [SS-043](https://github.com/Samska/samska-sandbox/issues/80)
- Pull request: None
- ADRs: [ADR 0008 (Proposed)](../adr/0008-rebuild-with-exclusive-candidate-runtime.md)
- Canonical documentation: [R1 handoff](../rebuild/R1.md), [parity matrix](../rebuild/PARITY.md)

## What you should learn

- Separating product behavior from implementation structure during a rewrite.
- Characterizing wire contracts before writing replacement code.
- Distinguishing a build classpath from the runtime dependency graph.
- Ownership of local processes, readiness identity and verification evidence.

### Core — Know this for interviews

Contract compatibility, immutable state ownership, runtime isolation and honest evidence boundaries.

## Concepts explained

A frozen contract describes observable inputs, outputs and invariants rather than classes. A new implementation can change its internal representation without adding fields, rounding prices or changing error codes that consumers rely on. Contract tests should expose unintended differences, not be rewritten to excuse them.

Immutability prevents callers from modifying stored state through an alias. It does not by itself make collection operations atomic; the store must still coordinate writes and produce stable snapshots.

Compiling two entry points together does not mean both applications should run in one context. Explicit bootstrap selection, narrow component scanning, bean/mapping tests and runtime identification establish different guarantees; each needs evidence. A successful build alone cannot establish which server answered a browser request.

Process ownership matters in local test tooling. An occupied port belongs to somebody else until proven otherwise. A launcher should refuse that port and only shut down descendants it started, never terminate processes merely because their name or port looks familiar.

## How Samska uses it

R1 is authorized to reconstruct only Product creation, collection browsing and identity detail in a partial candidate. The old application remains available and is not cut over. [The matrix](../rebuild/PARITY.md) freezes six response keys, relative Location, empty 400/404 bodies, optional mediaKey, nonnegative unrestricted-scale price and untrimmed nonblank text.

The planned new backend namespace is independent of the old business modules, with a separately selected bootstrap and build output. The new frontend must not import old components or adapters. API shape tests, domain tests, import/bean inspection and real-browser checks provide complementary evidence. Actual executed results and remaining gaps belong in [the handoff](../rebuild/R1.md), not in an assumption that the design already passed.

## Interview perspective

A strong explanation distinguishes rebuilding implementation from changing product scope, contract parity from source equality, and build isolation from runtime isolation. Discuss the cost of temporary dual bootstraps, why a partial candidate is useful, and what evidence permits a later capability cutover. Do not claim rollback restores process-local data.

## What not to worry about yet

Database migrations, authentication, hosting, distributed deployment and full First Order parity are outside R1. No framework, new dependency or microservice is required merely because the implementation is being rebuilt. This record is not an approval or a study gate.

## Reference

- [Issue #80](https://github.com/Samska/samska-sandbox/issues/80)
- [Approved R1 scope and pending evidence](../rebuild/R1.md)
- [From-scratch plan](../rebuild/RECONSTRUCTION.md)
- [Verification provenance](../AI-GOVERNANCE.md#human-verification)
