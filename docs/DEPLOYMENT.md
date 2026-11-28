# Deployment

This guide runs the hosted demo: a synthetic-data store that anyone may use, so it is constrained and disposable. The same images run in two ways: on [Railway](#railway) (the owner's chosen host) or on a [VPS](#what-runs-on-a-vps) with Docker Compose and Caddy.

## What runs on a VPS

`compose.demo.yaml` starts four containers: Caddy (the only one that publishes ports, 80 and 443, and that obtains and renews the TLS certificate), the web server (nginx serving the single-page application with a restrictive Content-Security-Policy and proxying `/api`), the backend with the `prod` profile and demo mode on, and PostgreSQL (no published port).

## Private first, public later

The stack supports two access modes, chosen only by configuration:

- **Private (default).** `DEMO_ACCESS=private`: Caddy puts the whole site, API included, behind a username and password. Nobody sees the store without it. Use this until the owner has validated the release on the server.
- **Public demo.** `DEMO_ACCESS=public` and `SAMSKA_DEMO_ENABLED=true`: the site opens to everyone with the demo banner and the Reset button, and `SAMSKA_DEMO_RESET_CRON="0 0 4 * * *"` resets the data every day at 04:00.

To switch, edit `.env.demo` and run `deploy/deploy.sh`. The administrator account and the application's own sign-in work the same in both modes; the private password is an extra gate in front, not a replacement.

## Railway

On Railway the project has three services, all built from this repository's Dockerfiles, and no Caddy: Railway terminates TLS and gives the web service a public `*.up.railway.app` address.

| Service | Source | Public | Notes |
| --- | --- | --- | --- |
| `Postgres` | Railway's PostgreSQL | No | Private network only. |
| `backend` | Root directory `backend`, config file `/backend/railway.json` | No | Health check `/actuator/health`; reachable only from `web` over the private network. |
| `web` | Root directory `web`, config file `/web/railway.json` | Yes | nginx serves the single-page application, proxies `/api` to `backend`, and applies the private-mode password. Health check `/healthz` (always open). |

### Variables

`backend` (reference variables use Railway's `${{service.VARIABLE}}` syntax):

| Variable | Value |
| --- | --- |
| `PORT` | `8080` |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}?connectTimeout=5&socketTimeout=10&loginTimeout=5` |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SAMSKA_ADMIN_EMAIL`, `SAMSKA_ADMIN_PASSWORD` | The administrator account; the password has at least 12 characters. |
| `SAMSKA_DEMO_ENABLED`, `SAMSKA_DEMO_RESET_CRON` | `false` and `-` while private; `true` and for example `0 0 4 * * *` for the public demo. |
| `SAMSKA_DEMO_SEED_PRODUCTS` | Optional: `true` creates the sample Products when the catalog is empty (see [Demo mode](#demo-mode)). |

`web`:

| Variable | Value |
| --- | --- |
| `PORT` | `8080` |
| `API_UPSTREAM` | `${{backend.RAILWAY_PRIVATE_DOMAIN}}:8080` |
| `WEB_ACCESS` | `private` (default) or `none` for the public demo. |
| `DEMO_ACCESS_USER`, `DEMO_ACCESS_HASH` | Private mode only: the user name and a bcrypt hash (see below). |

Generate the hash on your own machine, never put the plain password in a variable: `docker run --rm caddy:2-alpine caddy hash-password --plaintext '<password>'`. In private mode `web` refuses to start without a user and a hash, so a missing variable can never open the site.

### Setup (Railway CLI)

1. Install the CLI (`npm install -g @railway/cli`) and sign in once with `railway login`; the sign-in happens in your browser, so no token is shared.
2. Create the project and add the PostgreSQL service, then add the `backend` and `web` services by connecting this GitHub repository (branch `release/1.0`, root directories as in the table), set the variables above, and generate a public domain for `web` only. Connect the repository instead of uploading with `railway up` from Windows: the upload drops the executable bit and the Maven wrapper then fails with `Permission denied`.
3. If a service does not pick up its `railway.json` (it is found only when the service's config file path is `/backend/railway.json` or `/web/railway.json`), set the health check path and the restart policy in the service settings with the values from that file.
4. Deploy. Railway builds both Dockerfiles; open the `web` address, enter the private-mode password, and sign in as the administrator.

### Public demo later

Switching modes is configuration only: set `WEB_ACCESS=none` on `web` and `SAMSKA_DEMO_ENABLED=true` (and optionally the reset cron) on `backend`, then redeploy both. Setting `WEB_ACCESS=private` again closes the site.

### Notes

- With the repository connected, every push to the chosen branch deploys automatically. Use a branch you control, and expect the trial plan's credits to be consumed from the first deployment.
- Setting variables from PowerShell through standard input can add an invisible byte-order mark to the value; pass the value as an argument or check it after setting.
- Railway PostgreSQL keeps its own volume and backups policy; `deploy/backup.sh` is for the Compose stack. Take a dump with `pg_dump` against the Railway connection string before risky changes.
- `web` trusts the client address header only from private and Railway address ranges (`10.0.0.0/8`, `100.64.0.0/10`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`), so the rate limiter sees each visitor; check after the first deployment that repeated sign-in failures from one address are limited and a second address is not.
- `web` finds `backend` again after a redeploy because nginx resolves the name per request with the container's own DNS server.
- Check the web start-up behavior without Railway: `deploy/verify-web-config.sh` (needs Docker).

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

`SAMSKA_DEMO_ENABLED=true` (set by the Compose file) shows a banner on every page and enables **Reset demo data** on the Operations screen. A reset removes every Order, Payment attempt, Cart and customer account, restores stock to 25 and signs everyone else out; Products and the administrator stay. Set `SAMSKA_DEMO_RESET_CRON` to a Spring cron expression, for example `0 0 4 * * *`, to reset automatically. Set `SAMSKA_DEMO_SEED_PRODUCTS=true` to create six synthetic sample Products (each with a Bench illustration) when the backend starts with an empty catalog; they are Products, so the reset keeps them, and nothing is created while the catalog has Products, so changes made by the administrator are never overwritten (deleting every Product and restarting the backend creates the samples again).

## Operating notes

- `GET /actuator/health` is public; details are not exposed.
- The database volume `demo-postgres-data` persists until `docker compose ... down -v`; a dump is the safe copy.
- Caddy keeps its certificates in the `caddy-data` volume. Do not delete it, because Let's Encrypt limits how many certificates a domain can request.
- The web container trusts the client address only from the private Compose network, where Caddy sets it, so the rate limiter sees each visitor.
- Real data and real payments are never appropriate. See the [Threat Model](THREAT-MODEL.md) and [Security](SECURITY.md).

## Verification

The stack was run locally with the Compose file, a prebuilt backend jar and web build in the same base images, and `DEMO_DOMAIN=localhost` (Caddy's internal certificate): the backend became healthy under the `prod` profile; in private mode the site and API answered `401` without the password and `200` with it, and a wrong password was refused; switching to public mode opened the site, `/api/config` reported demo mode and HTTP redirected to HTTPS; a spoofed `X-Forwarded-For` did not bypass the rate limiter (the eleventh credential attempt was refused with `429`); `deploy/backup.sh` captured a created Product and `deploy/restore.sh` brought it back after deletion. Not exercised here: a real domain with a Let's Encrypt certificate, `deploy/deploy.sh` (it needs a Git remote on the server), and the Docker build stages that run `./mvnw` and `npm ci` inside the build, because the sandbox's network proxy intercepts TLS; a build host with TLS interception needs its certificate authority trusted in the build.

The Railway setup was verified here only in part: the web image's start-up configuration (private password, open mode, custom `PORT`, API proxying and the open health path) with `deploy/verify-web-config.sh`, the backend listening on `PORT` and answering the health check, and the Compose file still rendering. Found on the first real deployment: the backend image did not build (the Maven wrapper needs `unzip`, fixed in SS-079, and both images are now built in CI); `RAILWAY_PRIVATE_DOMAIN` resolved as expected; the web image then answered `502` on `/api` because nginx used Docker's `127.0.0.11` resolver, which Railway does not have (fixed in SS-080: the image sets `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` so nginx uses the container's own DNS server, and `deploy/verify-web-config.sh` checks it). Still to confirm there: the client-address ranges listed above.
