# SS-026: Repository Workflow Governance

- Work item: [SS-026](https://github.com/Samska/samska-sandbox/issues/39)
- ADRs: None
- Canonical documentation: [GitHub controls](../GITHUB.md), [AI engineering governance](../AI-GOVERNANCE.md), [Contributing](../../CONTRIBUTING.md), and [Roadmap](../ROADMAP.md)

## What you should learn

- GitHub Actions workflows, jobs, steps, and checks are different concepts.
- Small metadata taxonomies communicate ownership without label sprawl.
- Historical work-item identifiers are different from roadmap capabilities.
- Semantic Versioning expresses product milestones independently from work items.
- CI and security analysis can remain separate evidence sources.
- A README is a communication surface with a freshness boundary.
- Short-lived branch teardown is repository hygiene, not a substitute for retained PR history.

### Core - Know this for interviews

- Workflow versus job versus check.
- Historical identifiers versus planned capabilities.
- CI evidence versus independent security analysis.

## Concepts explained

A workflow groups automation. Jobs are independently scheduled units inside the
workflow, steps execute within jobs, and checks expose job or structured result
evidence in GitHub. Grouping jobs in one workflow does not make them sequential
or collapse their PR evidence.

A useful metadata taxonomy uses one work type and only materially relevant area
labels. Project fields remain the source for status and priority, avoiding
labels that duplicate dynamic workflow state.

An SS identifier belongs to the historical Issue that creates it. A roadmap
describes capabilities and sequence without reserving identifiers. Product
versions instead describe milestone releases using Semantic Versioning.

Short-lived branches should be removed after their work completes. Automatic
merged-PR deletion is useful cleanup automation, but teardown still verifies
the remote and local state. Deleting a branch does not delete the closed or
merged PR, its review discussion, or its checks, so history remains available.

## How Samska uses it

Samska's `CI` workflow keeps Repository validation, Backend, and Frontend as
independent jobs. CodeQL and GitGuardian remain separate checks. The roadmap
keeps completed SS history while listing future First Order capabilities
without SS numbers. README summarizes current architecture and capabilities,
while canonical documentation retains detailed policy and evidence.

## Interview perspective

Explain why workflow consolidation can improve navigation without sacrificing
parallelism or check granularity. Distinguish a release version from a work
item, and explain why a README should communicate current behavior without
becoming a duplicate of architecture or security documentation.

## What not to worry about yet

This work does not introduce required status checks, package publishing,
deployment, persistence, future product modules, or additional security
platforms.

## Reference

- Issue: [SS-026](https://github.com/Samska/samska-sandbox/issues/39)
- Workflow: [CI](../../.github/workflows/ci.yml)
- [GitHub controls](../GITHUB.md)
- [Roadmap](../ROADMAP.md)
- [AI engineering governance](../AI-GOVERNANCE.md)
