# Deployment

This guide runs the hosted demo: a synthetic-data store that anyone may use, so it is constrained and disposable. It does not choose a hosting provider; the owner decides where it runs.

## What runs

`compose.demo.yaml` starts four containers: Caddy (the only one that publishes ports, 80 and 443, and that obtains and renews the TLS certificate), the web server (nginx serving the single-page application with a restrictive Content-Security-Policy and proxying `/api`), the backend with the `prod` profile and demo mode on, and PostgreSQL (no published port).

## Private first, public later

The stack supports two access modes, chosen only by configuration:

- **Private (default).** `DEMO_ACCESS=private`: Caddy puts the whole site, API included, behind a username and password. Nobody sees the store without it. Use this until the owner has validated the release on the server.
- **Public demo.** `DEMO_ACCESS=public` and `SAMSKA_DEMO_ENABLED=true`: the site opens to everyone with the demo banner and the Reset button, and `SAMSKA_DEMO_RESET_CRON="0 0 4 * * *"` resets the data every day at 04:00.

To switch, edit `.env.demo` and run `deploy/deploy.sh`. The administrator account and the application's own sign-in work the same in both modes; the private password is an extra gate in front, not a replacement.

## What you need to provide

- A Linux VPS: Ubuntu 24.04 LTS, at least 2 vCPU, 4 GB RAM and 40 GB disk.
- A domain or subdomain whose DNS `A` record points to the VPS address.
- SSH access for a user with `sudo`, using your public key.
- Open ports 22, 80 and 443.
- The secrets for `.env.demo`: database password, administrator email and administrator password (at least 12 characters). Generate them yourself and keep them out of Git and chat.

## First setup on the VPS

1. Install Docker Engine and the Compose plugin from Docker's official instructions for Ubuntu, add your user to the `docker` group, and enable a firewall that allows only 22, 80 and 443 (for example `ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable`).
2. Clone the repository and check out the release: `git clone https://github.com/Samska/samska-sandbox.git && cd samska-sandbox`.
3. Copy `.env.demo.example` to `.env.demo`, set `DEMO_DOMAIN`, `POSTGRES_PASSWORD`, `SAMSKA_ADMIN_EMAIL` and `SAMSKA_ADMIN_PASSWORD`, and for the private mode also `DEMO_ACCESS_USER` and `DEMO_ACCESS_HASH` (make the hash with `docker run --rm caddy:2-alpine caddy hash-password --plaintext '<password>'` and keep it in single quotes). Then run `chmod 600 .env.demo`.
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

The stack was run locally with the Compose file, a prebuilt backend jar and web build in the same base images, and `DEMO_DOMAIN=localhost` (Caddy's internal certificate): the backend became healthy under the `prod` profile; in private mode the site and API answered `401` without the password and `200` with it, and a wrong password was refused; switching to public mode opened the site, `/api/config` reported demo mode and HTTP redirected to HTTPS; a spoofed `X-Forwarded-For` did not bypass the rate limiter (the eleventh credential attempt was refused with `429`); `deploy/backup.sh` captured a created Product and `deploy/restore.sh` brought it back after deletion. Not exercised here: a real domain with a Let's Encrypt certificate, `deploy/deploy.sh` (it needs a Git remote on the server), and the Docker build stages that run `./mvnw` and `npm ci` inside the build, because the sandbox's network proxy intercepts TLS; a build host with TLS interception needs its certificate authority trusted in the build.
