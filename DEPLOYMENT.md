# Deploying Soon on a VPS with Docker Compose

A VPS is the right host for this app: storage is SQLite, which needs a real
filesystem that persists between requests. A mounted Docker volume gives exactly
that, so nothing about the code has to change.

TLS and routing are handled by the nginx already running on the VPS. This stack
adds no proxy of its own.

Everything below was verified by building the image and running the stack —
including a full backup, wipe and restore drill.

## What you need

- Docker Engine with the Compose plugin.
- The external `proxy` network the other projects use. It already exists; if not:
  `docker network create proxy`.
- A DNS record pointing at the VPS, and an nginx host entry (below).
- **Port 3003 free.** That is what this stack claims. `lycasol-mini-app` uses
  3002, so check nothing else took 3003:
  `ss -ltnp | grep 3003`. To change it, edit both the `PORT` env and the
  `ports:` mapping in `docker-compose.prod.yml` — keep the two numbers equal.

## Files involved

| File | Role |
|---|---|
| [docker-compose.prod.yml](docker-compose.prod.yml) | The single `app` service. |
| [Dockerfile](Dockerfile) | Three-stage build producing a standalone Next.js server. |
| [.dockerignore](.dockerignore) | Keeps `data/`, `.env*`, `node_modules` out of the image. |
| [.env.example](.env.example) | Template for `.env.production`. |

## Deploy

```bash
git clone git@github.com:mohammadalnajar/timer.git soon && cd soon
cp .env.example .env.production
```

Edit `.env.production`:

```bash
SOON_SITE_URL=https://soon.example.com
TZ=Europe/Amsterdam
```

`SOON_SITE_URL` is the one value that matters. It makes OG image URLs absolute,
which is what gets a preview card to render in WhatsApp and iMessage. It must
include the scheme, match the domain nginx serves, and have no trailing slash.
The app still runs without it — only link previews break — so nothing fails
loudly if you get it wrong.

`.env.production` is gitignored. Never commit it.

Then:

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

The first build takes a few minutes. `ps` should show `Up (healthy)` — there is
a healthcheck polling the app every 30 seconds.

## Pointing nginx at it

The container is reachable two ways, and the stack supports both. Pick whichever
matches how your nginx runs.

**If nginx runs in Docker** (Nginx Proxy Manager and similar), forward over the
shared `proxy` network using the container name:

```
Forward Hostname / IP:  soon
Forward Port:           3003
```

Enable *Websockets Support* and *Block Common Exploits* if your UI offers them.
Both are harmless here.

**If nginx runs on the host**, forward to the published loopback port:

```nginx
server {
    server_name soon.example.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The port is bound to `127.0.0.1`, not `0.0.0.0`, so it is never reachable from
the internet directly — only through nginx.

Whichever route you use, make sure `X-Forwarded-Proto` is set and that
`SOON_SITE_URL` uses `https://`. Those two keep generated links and OG image
URLs correct.

## Environment variables

| Variable | Where | Default | Notes |
|---|---|---|---|
| `SOON_SITE_URL` | `.env.production` | `http://localhost:3000` | Public origin. Required in practice — see above. |
| `TZ` | `.env.production` | `UTC` | Container timezone. Only affects log timestamps; countdowns store a UTC instant plus their creator's timezone. |
| `PORT` | compose | `3003` | Next's standalone server listens here. Keep equal to the host side of `ports:`. |
| `SOON_DB_PATH` | compose | `/data/soon.db` | Already points at the volume. Leave it alone. |

## How it is wired

- One container, no database service. The app runs as a non-root user
  (`nextjs`, uid 1001).
- `/data` is created in the image owned by that user, so the empty named volume
  mounted there inherits the ownership and the app can write its database.
- Only Next.js's standalone output ships — no build toolchain, and no
  `node_modules` beyond the traced runtime dependencies.
- Memory is capped at 512 MB. That is comfortable; OG image rendering is the
  only thing that spikes.

## Backups

**Read this before trusting the deployment with anything you care about.** Every
countdown lives in one SQLite file on the `soon-data` volume. There is no other
copy, and no external database to fall back on.

The database runs in WAL mode, so recent commits may sit in `soon.db-wal` rather
than `soon.db`. **Copying `soon.db` on its own can silently lose data.** Take a
consistent snapshot instead. This works while the app is serving traffic, and
needs no extra tooling because the app already bundles SQLite:

```bash
cd /srv/soon
docker compose -f docker-compose.prod.yml exec -T -w /app app node -e "
const Database = require('better-sqlite3');
const db = new Database('/data/soon.db', { readonly: true });
db.exec(\"VACUUM INTO '/data/backup.db'\");
db.close();
"
docker compose -f docker-compose.prod.yml cp app:/data/backup.db "./soon-$(date +%F).db"
docker compose -f docker-compose.prod.yml exec -T app rm /data/backup.db
```

Note the service name is `app`, while the container is named `soon`. Compose
subcommands take the service; plain `docker exec` takes the container.

That leaves one self-contained file to copy off the box. As a nightly cron job:

```cron
0 4 * * * cd /srv/soon && docker compose -f docker-compose.prod.yml exec -T -w /app app node -e "const D=require('better-sqlite3');const d=new D('/data/soon.db',{readonly:true});d.exec(\"VACUUM INTO '/data/backup.db'\");d.close();" && docker compose -f docker-compose.prod.yml cp app:/data/backup.db /srv/backups/soon-$(date +\%F).db && docker compose -f docker-compose.prod.yml exec -T app rm /data/backup.db
```

Note the escaped `\%` — cron treats a bare `%` as a newline.

### Restoring

Verified end to end: backup, delete the live database, restore, countdown back.

```bash
cd /srv/soon
docker compose -f docker-compose.prod.yml stop app
docker compose -f docker-compose.prod.yml run --rm -v "$PWD:/restore" --entrypoint sh app \
  -c 'rm -f /data/soon.db-wal /data/soon.db-shm && cp /restore/soon-2026-07-30.db /data/soon.db'
docker compose -f docker-compose.prod.yml start app
```

Removing the stale `-wal` and `-shm` files matters — leaving them beside a
restored database can corrupt it.

## Updating

```bash
cd /srv/soon
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

Compose rebuilds and replaces the container. The volume is untouched, so every
countdown survives — verified. Take a backup first anyway.

To roll back, check out the previous commit and rebuild.

Prune old images now and then: `docker image prune -f`.

## Logs and troubleshooting

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec app ls -la /data   # database on the volume?
```

**`network proxy declared as external, but could not be found`.** Create it:
`docker network create proxy`.

**Container restarts in a loop.** Check the logs. The usual cause is `/data` not
being writable — confirm it is the named volume and not a bind mount owned by
root. If you switched to a bind mount, `sudo chown -R 1001:1001 ./your-data-dir`.

**nginx shows 502.** The app is not reachable on the route nginx is using. If
nginx is in Docker, it must share the `proxy` network and target `soon:3003`, not
`127.0.0.1`. Confirm from inside another container on that network:
`docker run --rm --network proxy curlimages/curl -s -o /dev/null -w '%{http_code}' http://soon:3003/`.

**Link previews show no image.** `SOON_SITE_URL` is wrong or still `http://`.
Fix it and re-run `up -d`.

**`down -v` deleted everything.** The `-v` flag removes volumes, including
`soon-data`. Plain `down` leaves it alone. This is the one command that can
destroy the data.

## Building elsewhere

The build needs more memory than the running app. On a small VPS, build on your
machine and push to a registry instead:

```bash
docker buildx build --platform linux/amd64 -t ghcr.io/mohammadalnajar/soon:latest --push .
```

`--platform linux/amd64` matters on an Apple Silicon Mac — the native SQLite
binary is architecture-specific, and an arm64 image will not run on an x86 VPS.
Then swap the `build: .` line in `docker-compose.prod.yml` for
`image: ghcr.io/mohammadalnajar/soon:latest` and run
`docker compose -f docker-compose.prod.yml pull && ... up -d`.

## Notes

- The image is about 460 MB, mostly the Debian slim Node base. Alpine would be
  smaller, but `better-sqlite3` is a native module and the glibc prebuilds are
  the reliable path.
- No migration step. The schema is created on first connection with
  `CREATE TABLE IF NOT EXISTS`, so a fresh volume just works.
