# Product

## Purpose

Samska Sandbox is a public, non-commercial educational engineering platform. It uses a fictional commerce and logistics domain to progressively practice real-world engineering disciplines, including software, backend, frontend, mobile, quality, security, DevOps, platform, SRE, observability, performance, data, architecture, and AI-assisted software engineering.

The project's non-commercial purpose does not restrict downstream use of the Apache-2.0 licensed source code.

## Current Scope

The repository currently contains Java backend and React frontend foundations plus a local PostgreSQL runtime. There is no business-domain behavior, business UI, business API, application persistence, or deployment environment.

## Initial Product Milestone

v0.1.0, "First Order", will eventually enable a user to:

1. Open the web application.
2. Browse products.
3. Add a product to a cart.
4. Check out.
5. Receive a simulated payment decision.
6. Create an order.
7. View an order confirmation.

Docker Compose can start PostgreSQL for local development, but the backend and frontend are not containerized and PostgreSQL is not integrated with the application. A future full-application workflow should remain simple when its behavior is justified.

## Future Domain Scope

The platform may evolve to cover customers, catalog, cart, checkout, orders, inventory, simulated payments, delivery, couriers, notifications, fraud/risk simulation, analytics, and a simulation engine. These are opportunities for progressive learning, not commitments to implement every domain.

## Product Constraints

- All data must be synthetic. No real customer data is permitted.
- Payments must be simulated. No real financial transactions are permitted.
- A future public demo must be constrained and disposable.
- AI agents may produce or modify code, but human accountability for decisions, review, validation, risk assessment, and understanding remains mandatory.

## Explicit Non-Goals

- Operating a real commerce business.
- Processing real payments.
- Storing or exposing real customer data.
- Building microservices before engineering evidence justifies extraction.
- Treating the roadmap as a mandatory technology adoption checklist.

See [the roadmap](ROADMAP.md) for planned work and [AI governance](AI-GOVERNANCE.md) for delivery responsibilities.
