# SS-009: Product Domain

- Status: Active
- Work date: 2026-09-15
- Last reviewed: 2026-09-15
- Work item: [SS-009, Issue #22](https://github.com/Samska/samska-sandbox/issues/22)
- Pull request: Not created
- ADRs: [ADR 0001: Adopt a Modular Monolith for v0.1](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Architecture Principles](../architecture/principles.md), [Testing Strategy](../TESTING.md), and [AI Engineering Governance](../AI-GOVERNANCE.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## Study Surface

Catalog owns Product as a framework-independent entity that protects its own identity, name, and price invariants without assuming an API or persistence implementation.

### Must Remember

- Catalog owns Product business concepts; a generic technical package would hide that ownership.
- Product identity follows immutable `ProductId`, not mutable name or price.
- Product owns its invariants while a future application layer coordinates use cases.
- A Value Object needs concrete semantic value: `ProductId` qualifies now, while `ProductName` and Money are deferred.
- Aggregate Root defines a consistency and ownership boundary; it does not imply persistence or child entities.

### Mental Model

```text
Catalog
  |
  +-> ProductId -> entity identity and equality
  |
  +-> Product -> name and price invariants -> rename / changePrice

Future application coordination ----> Product operations
HTTP, persistence, and inventory ---X Product domain
```

### Active Recall

#### Why does Product equality use only ProductId?

<details>
<summary>Answer guide</summary>

- An Entity remains the same Product when mutable name or price changes.
- Including mutable state in equality would make identity unstable and could break hash-based collections after a valid change.

</details>

#### Why does Catalog own Product instead of a generic domain package?

<details>
<summary>Answer guide</summary>

- Module ownership should follow business capability, as required by the modular-monolith principles.
- A generic package groups concepts by technical role and makes ownership and future dependencies less explicit.

</details>

#### What is Product responsible for, and what remains for a future application layer?

<details>
<summary>Answer guide</summary>

- Product owns its business invariants and intentional state changes.
- A future application layer coordinates use cases and cross-module workflows without moving Product rules out of the domain.
- Transport and persistence remain outside the domain behind appropriate adapters or boundaries.

</details>

#### Why is BigDecimal used directly instead of introducing Money?

<details>
<summary>Answer guide</summary>

- The current domain needs an exact non-negative decimal price but has no currency, conversion, rounding, tax, or discount requirement.
- A Money type would add policy and abstraction without present business value.

</details>

### Decision Drills

#### Decision Drill: Product-specific identity

**Problem:** Product must have stable entity identity without allowing future identifiers to be confused at Catalog boundaries.

**Options:** Use raw `UUID`, a `String`, or a `ProductId` Value Object that wraps `UUID`.

**Decision:** Use immutable `ProductId` wrapping `UUID`.

**Why:** The type makes the business meaning explicit while preserving standard UUID generation and record value semantics.

**Trade-off:** One small type is added where raw UUID would be shorter.

**Reconsider When:** Identity crosses a published contract or a creation use case justifies an application-level generation policy.

#### Decision Drill: Exact price without a Money abstraction

**Problem:** Product needs a price that rejects negative values without inventing monetary policy.

**Options:** Use `double`, use `BigDecimal`, or introduce Money with currency and rounding behavior.

**Decision:** Store the supplied non-negative `BigDecimal` exactly.

**Why:** BigDecimal provides exact decimal representation without assuming scale, currency, conversion, or rounding rules that Samska has not defined.

**Trade-off:** Numerically equivalent prices can retain different scales, and richer monetary behavior remains deferred.

**Reconsider When:** A real pricing requirement defines currency, rounding, tax, discounts, or cross-context monetary exchange.

Decision Drills are study aids, not authoritative decisions or ADR replacements.

### Concept Cards

#### Entity and Aggregate Root

- **Meaning:** An Entity has stable identity independent of mutable attributes. An Aggregate Root protects the consistency of the state it owns.
- **Samska application:** Product is equal by ProductId and controls changes to its name and price through named operations.
- **Boundary or common mistake:** Aggregate Root does not require a repository, transaction, child entities, or persistence annotations.

### Hands-on Reinforcement

#### Inspect Product invariant boundaries

- **Prerequisite:** Java 25 and the Maven Wrapper are available; work from `backend/`.
- **Perform or inspect:** run `./mvnw.cmd --batch-mode --no-transfer-progress -Dtest=ProductTest test` on Windows, then inspect `ProductTest` cases for rejected values and preserved state.
- **Expected observation:** Product tests run without Spring or PostgreSQL and verify that invalid rename or price changes do not alter existing state.
- **Explain:** distinguish local entity invariants from future HTTP validation, persistence constraints, and cross-module coordination.
- **Cleanup:** Maven creates only ignored `target/` output; no database container is started.
- **Proves / does not prove:** proves Product's isolated domain behavior; does not prove an API, persistence, inventory, or end-to-end catalog workflow.

### Interview Drill

#### Explain the smallest useful Product model

- **Expected reasoning:** Catalog ownership, ProductId identity semantics, name and price invariants, controlled mutation, BigDecimal without currency policy, and the aggregate boundary's limits.
- **Likely follow-up:** what concrete requirement would justify ProductName, Money, Product status, or persistence integration?
- **Short, 15-30 seconds:** Product is a Catalog-owned entity whose ProductId defines identity and whose operations protect valid name and non-negative price state without framework coupling.
- **Technical, 1-2 minutes:** contrast entity identity with mutable state, justify the two Value Object decisions, and distinguish Product's local consistency from future application coordination.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** ProductId versus raw UUID, or BigDecimal versus Money.
- **Concept or boundary to explain:** entity identity and Aggregate Root without persistence.
- **Repository action:** inspect `backend/src/main/java/io/github/samska/sandbox/catalog/Product.java` and identify where invalid state is rejected.

## Reference Surface

### Historical Context and Outcome

On 2026-09-15, Samska had Java and React foundations plus a local PostgreSQL runtime, but no business-domain implementation. SS-009 introduced the first Catalog-owned Product model with identity, name, and price business state, framework-independent invariants, controlled mutation, and pure unit tests. It introduced no business API, persistence integration, or additional business module.

### Implementation and Decision Evidence

`ProductId` is an immutable record that wraps a non-null UUID and offers local UUID generation. `Product` is a final controlled-mutable entity with immutable identity and mutable name and price. Its constructor, `rename`, and `changePrice` all validate the values before state assignment. Product equality and hash code depend only on ProductId.

Product stores an exact non-negative BigDecimal without automatic rounding, scale conversion, currency, tax, discount, or conversion behavior. ProductName and Money remain deferred because current requirements do not define the rules that would give them domain value.

`ProductTest` runs as a pure JUnit 5 and AssertJ test. The focused Maven invocation completed with 16 tests passing without starting Spring or PostgreSQL. The normal Maven `clean verify` lifecycle then passed 17 tests, including the existing Spring health smoke test.

### Security, Verification, and Risks

The Product model adds no HTTP endpoint, persistence configuration, dependency, secret, external integration, or real data. Test examples use synthetic product values. The model protects its own invalid name and negative-price state but does not provide API validation, authorization, persistence constraints, identifier uniqueness coordination, inventory behavior, or monetary policy.

Focused Product verification passed with `./mvnw.cmd --batch-mode --no-transfer-progress -Dtest=ProductTest test`, and complete backend verification passed with `./mvnw.cmd --batch-mode --no-transfer-progress clean verify`. Static Compose validation passed with an ephemeral environment value and did not start PostgreSQL; `git diff --check` found no whitespace errors. Node/npm, Markdownlint, Lychee, EditorConfig Checker, and actionlint were unavailable in the local environment, so frontend and those repository checks remain for pull-request CI or a provisioned local environment.

### Delivery History and Deferred Work

Issue #22 is the canonical scope and acceptance-criteria record. No pull request exists at this point. REST, Catalog API, JSON contracts, persistence, PostgreSQL integration, repositories, schemas, migrations, inventory, cart, checkout, payments, messaging, Redis, deployment, Product status, ProductName, and Money remain deferred.

### Sources

- [Issue #22](https://github.com/Samska/samska-sandbox/issues/22)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Architecture Principles](../architecture/principles.md)
- [Testing Strategy](../TESTING.md)
- [Learning Journal Guide](README.md)
