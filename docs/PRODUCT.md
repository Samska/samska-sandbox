# Product

## Purpose

Samska Sandbox is a public, non-commercial educational engineering platform. It uses a fictional commerce and logistics domain to progressively practice real-world engineering disciplines, including software, backend, frontend, mobile, quality, security, DevOps, platform, SRE, observability, performance, data, architecture, and AI-assisted software engineering.

The project's non-commercial purpose does not restrict downstream use of the Apache-2.0 licensed source code.

## Current Scope

The repository currently contains Java and React applications, a local PostgreSQL runtime, a Catalog boundary with a framework-independent Product domain model, and a Cart boundary; Checkout is an editable frontend view of the current Cart. Each Product has a validated name, description, price, and optional media key, and the Catalog HTTP API supports Product creation, collection browsing, identity retrieval, full update, and deletion with that data. The React UI provides a refined commerce storefront: responsive Product browsing with consistent product cards, a selectable Product detail view with curated local media or an intentional monogram fallback and focus return to browsing, unified loading, pending, success, and error feedback, an accessible Cart drawer, quantity updates, item removal, and server-calculated totals. A non-empty Cart exposes a Checkout view that presents the current Cart's Product identities, names, unit prices, quantities, line subtotals, and total, and lets the user edit quantities and remove items directly using the existing Cart operations; every change is reflected immediately from the server response. The immutable transactional snapshot is deferred to future Payment Simulator work. The application also provides a distinct Admin Product-management surface: `/admin/products` is a compact management list with local case-insensitive name search, thumbnails, price, and Edit/Delete actions; `/admin/products/new` hosts a dedicated creation form and `/admin/products/{id}/edit` a matching edit form, each with Name, Description, Price, and a staged Product image section. Deletion requires explicit confirmation and is refused with `409 Conflict` while the Product is in the current Cart; absent IDs return `404`. Creating or saving Product details and uploading or removing an image are separate requests: the forms report partial success accurately, never claim an unconfirmed result, and offer image retry without repeating the field operation. The Admin surface lets an administrator upload, replace, and remove one JPEG image per Product; uploads are validated and re-encoded server-side against fixed limits (3 MiB multipart request, 2 MiB input file, 2048 pixels per side, 4 million pixels, 2 MiB normalized output, 32 MiB aggregate stored bytes), stored only in bounded backend process memory, and lost with the Product on restart. Uploaded media takes display precedence in Market cards and Product detail, invalid uploads leave the current image unchanged, and removing an upload reveals the retained curated media or the monogram fallback. Re-encoding strips EXIF orientation, so some phone photos can appear sideways. The Market at `/` contains no Product setup or identity-lookup controls. `/admin/products` is a navigation path, not an access-control boundary, and provides no security before authentication and authorization exist. Catalog and Cart data are temporary and process-local; Checkout holds no server-side state at this stage. There is no application persistence, PostgreSQL application integration, authentication, payment, or deployment environment.

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
