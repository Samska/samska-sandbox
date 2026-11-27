# Deployment

This guide runs the hosted demo: a synthetic-data store that anyone may use, so it is constrained and disposable. It does not choose a hosting provider; the owner decides where it runs.

## What runs

`compose.demo.yaml` starts four containers: Caddy (the only one that publishes ports, 80 and 443, and that obtains and renews the TLS certificate), the web server (nginx serving the single-page application with a restrictive Content-Security-Policy and proxying `/api`), the backend with the `prod` profile and demo mode on, and PostgreSQL (no published port).

## What you need to provide

- A Linux VPS: Ubuntu 24.04 LTS, at least 2 vCPU, 4 GB RAM and 40 GB disk.
- A domain or subdomain whose DNS `A` record points to the VPS address.
- SSH access for a user with `sudo`, using your public key.
- Open ports 22, 80 and 443.
- The secrets for `.env.demo`: database password, administrator email and administrator password (at least 12 characters). Generate them yourself and keep them out of Git and chat.

## First setup on the VPS

1. Install Docker Engine and the Compose plugin from Docker's official instructions for Ubuntu, add your user to the `docker` group, and enable a firewall that allows only 22, 80 and 443 (for example `ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable`).
2. Clone the repository and check out the release: `git clone https://github.com/Samska/samska-sandbox.git && cd samska-sandbox`.
3. Copy `.env.demo.example` to `.env.demo`, set `DEMO_DOMAIN`, `POSTGRES_PASSWORD`, `SAMSKA_ADMIN_EMAIL` and `SAMSKA_ADMIN_PASSWORD`, and run `chmod 600 .env.demo`.
4. Run `deploy/deploy.sh`. It pulls, builds, starts the stack and waits for the backend to be healthy. Open `https://<your domain>`, sign in as the administrator, and create a few synthetic Products.

## Updating, backups and recovery

- **Update:** run `deploy/deploy.sh` again. It fast-forwards the checked-out branch and rebuilds.
- **Backup:** `deploy/backup.sh` writes a compressed dump to `backups/` and keeps the newest 14. Schedule it, for example `30 3 * * * /home/you/samska-sandbox/deploy/backup.sh`, and copy dumps off the server.
- **Restore:** `deploy/restore.sh backups/<file>.sql.gz` asks for confirmation, replaces the database contents and restarts the backend.
- **Logs:** `docker compose --env-file .env.demo -f compose.demo.yaml logs -f backend`. Each request has an `X-Request-Id` that is also returned in the response header.
- **Rate limits and sessions** live in the backend process and reset when it restarts.

## Demo mode

`SAMSKA_DEMO_ENABLED=true` (set by the Compose file) shows a banner on every page and enables **Reset demo data** on the Operations screen. A reset removes every Order, Payment attempt, Cart and customer account, restores stock to 25 and signs everyone else out; Products and the administrator stay. Set `SAMSKA_DEMO_RESET_CRON` to a Spring cron expression, for example `0 0 4 * * *`, to reset automatically.

## Operating notes

- `GET /actuator/health` is public; details are not exposed.
- The database volume `demo-postgres-data` persists until `docker compose ... down -v`; a dump is the safe copy.
- Caddy keeps its certificates in the `caddy-data` volume. Do not delete it, because Let's Encrypt limits how many certificates a domain can request.
- The web container trusts the client address only from the private Compose network, where Caddy sets it, so the rate limiter sees each visitor.
- Real data and real payments are never appropriate. See the [Threat Model](THREAT-MODEL.md) and [Security](SECURITY.md).

## Verification

The backend and web images were exercised locally with the Compose file: the backend became healthy under the `prod` profile, the web server delivered the single-page application with its policy headers, `/api/config` reported demo mode, API responses carried a request ID, and the eleventh credential attempt was refused with `429`. The Caddy service, the TLS certificate and the deploy, backup and restore scripts depend on a real domain and server and are exercised on the first deployment. The Docker builds run `./mvnw` and `npm ci` inside the build; a build host with TLS interception needs its certificate authority trusted in the build.
