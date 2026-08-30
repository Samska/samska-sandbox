# Security Policy

## Reporting a Vulnerability

Do not report suspected vulnerabilities through public issues, discussions, pull requests, or commits.

Use GitHub Private Vulnerability Reporting as the preferred reporting path for this repository. If you cannot submit a private report, contact the repository owner through the contact method on the owner's GitHub profile and include enough detail to reproduce and assess the issue.

Please provide:

- A clear description of the issue and its potential impact.
- Reproduction steps or a proof of concept.
- Affected files, versions, endpoints, or configurations when known.
- Suggested remediation, if available.

The project will acknowledge reports, assess severity and scope, and coordinate remediation before public disclosure where practical.

## Contributor Expectations

- Never commit secrets, credentials, private keys, access tokens, real connection strings, or real customer data.
- Do not add real payment processing. Payments in this project are simulated.
- Use synthetic data for all public or shared environments.
- Do not expose privileged debug, simulation, chaos, or infrastructure controls anonymously.
- Treat dependencies, deployment configuration, APIs, logs, and data handling as security-relevant changes.

Detailed engineering guidance is in [docs/SECURITY.md](docs/SECURITY.md). Intended GitHub repository controls and their verification status are in [docs/GITHUB.md](docs/GITHUB.md).
