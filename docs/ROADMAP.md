# Roadmap

## How To Read This Roadmap

The near-term work items below are the planned sequence for the first product milestone. They define intended scope, but do not authorize unrequested work or guarantee a technology choice before evidence supports it.

Long-term versions are directional learning themes, not fixed commitments or a technology checklist. A future technology is evaluated only when an identified engineering problem justifies it.

Execution tracking belongs in GitHub Issues and Projects when configured. This document remains the durable product and engineering direction.

## v0.1.0: First Order

| ID | Planned Work |
| --- | --- |
| SS-001 | Bootstrap Samska Sandbox repository |
| SS-002 | Define architecture principles |
| SS-003 | Define AI engineering guidelines |
| SS-004 | Configure GitHub repository security |
| SS-005 | Configure initial repository/documentation CI |
| SS-006 | Bootstrap Java backend and evolve backend-specific CI |
| SS-007 | Bootstrap React application and evolve frontend-specific CI |
| SS-008 | Configure PostgreSQL with Docker Compose |
| SS-009 | Implement product domain |
| SS-010 | Implement product catalog API |
| SS-011 | Implement product catalog UI |
| SS-012 | Implement shopping cart |
| SS-013 | Implement checkout |
| SS-014 | Implement payment simulator |
| SS-015 | Implement order creation |
| SS-016 | Implement First Order end-to-end journey and E2E infrastructure |
| SS-017 | Release Samska Sandbox v0.1.0 |

SS-005 may establish lightweight repository or documentation checks when justified. It must not predict application build systems. Backend, frontend, persistence/integration, and end-to-end CI evolve with the corresponding implementation and test infrastructure.

## Directional Evolution

| Version | Directional Theme | Evidence That May Trigger Evaluation |
| --- | --- | --- |
| v0.2 | Quality maturity | Identified testing gaps or unreliable delivery feedback |
| v0.3 | Caching / Redis | Measured catalog read pressure or unacceptable latency |
| v0.4 | Event-driven processing / RabbitMQ | Synchronous workflows become slow, fragile, or operationally coupled |
| v0.5 | Inventory concurrency | Concurrent stock updates expose consistency or contention problems |
| v0.6 | React Native | A justified mobile learning or product need exists |
| v0.7 | Observability | Insufficient visibility into behavior, failures, or dependencies |
| v0.8 | Operational dashboards | Defined operational questions require actionable views |
| v0.9 | Infrastructure as Code | Repeated environment setup requires reproducibility and reviewability |
| v1.0 | Secured public demo | A bounded, disposable demo can meet defined security controls |
| v1.1 | Performance engineering | Performance risks or service objectives require measurement and tuning |
| v1.2 | Security engineering expansion | Threat-model or assessment findings justify additional controls |
| v1.3 | Data engineering | Analytics or simulation needs require governed data pipelines |
| v1.4 | Simulation engine | Product learning goals justify a dedicated simulation capability |
| v1.5 | Resilience engineering | Failure-mode analysis identifies resilience gaps |
| v1.6 | SRE / SLI / SLO / error budgets | Reliable operational signals and service objectives are needed |
| v1.7 | Chaos engineering | Mature observability and resilience controls support safe experiments |
| v2.0 | Evaluate service extraction / microservices | Clear independently evolving boundaries and operational evidence justify it |

Any significant change to this direction requires the relevant documentation and, when architectural, an ADR update. See [ARCHITECTURE.md](ARCHITECTURE.md) and [the ADR guide](adr/README.md).
