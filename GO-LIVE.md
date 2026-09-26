# Orin go-live runbook

Every step needed to take the ecosystem from merged code to a working
`orinai.org`, in the order that actually works. Each phase has a **verify**
line: run it and confirm the output before moving on. If a step fails, the
troubleshooting table at the bottom tells you which check to go back to.

The Oracle-specific detail lives in
[`orin-router-service/deploy/oracle/README.md`](https://github.com/januththedev/orin-router-service/blob/main/deploy/oracle/README.md);
this document is the whole system.

---

## Phase 0 — Verify locally before you deploy anything

Never deploy a thing you have not run. From each repo:

```bash
cd orin-router-service && npm ci && git submodule update --init --recursive \
  && npm run platform:build && npm run check          # expect exit 0
cd ../Orin-AI          && npm ci && git submodule update --init --recursive && npm run check
cd ../orin-tools       && npm ci && git submodule update --init --recursive && npm run check
cd ../orin-console     && npm ci && npm run check
cd ../orin-mcp         && npm ci && npm test
cd ../orin-ecosystem   && npm ci && npm run check
cd ../orin-code-cli    && npm test
cd ../orin-automations && npm test
cd ../orin-platform    && npm ci && npm run typecheck
cd ../Orin-Code/orin-desktop-app && npm ci && npm run typecheck && npm test
cd ../orin-code-vscode && npm ci && npm test
```

`orin-agent` is the exception: its suite assumes a POSIX host and will not
collect on Windows (`os.geteuid`). Run it on Linux or in CI.

**Verify:** every one of the above exits 0. If a submodule is missing, the
error is an `npm ci` usage dump — run `git submodule update --init --recursive`
in that repo.

---

## Phase 1 — Accounts and credentials

You need these before anything can start. None can be created from a repository.

| What | Where | Used by |
| --- | --- | --- |
| `orinai.org` DNS | Cloudflare free is fine | everything |
| Oracle Cloud account + VM | console.oracle.com | Router |
| Neon Postgres | neon.tech | Router, Core, Console |
| Upstash Redis | console.upstash.io | Router, Tools |
| Vercel account | vercel.com | apex, Chat, Tools, Console, MCP |
| Telegram bot(s) | @BotFather | Chat, phone link |
| OpenRouter key | openrouter.ai | Chat, Router (free tier) |

Generate the shared secrets once and keep them somewhere safe:

```bash
openssl rand -base64 32   # ORIN_PROVIDER_KEK_CURRENT   (Router only)
openssl rand -hex 32      # ORIN_ROUTER_SERVICE_SIGNING_KEY
openssl rand -hex 16      # ORIN_ROUTER_REDIS_HASH_KEY
openssl rand -hex 16      # CRON_SECRET
openssl rand -hex 32      # ORIN_TOOLS_ASSERTION_SECRET
openssl rand -hex 32      # TOKEN_ENCRYPTION_KEY  (Core and Console MUST match)
```

**Two values must be identical on both sides or nothing authenticates:**

- `ORIN_ROUTER_SERVICE_SIGNING_KEY` — Core mints assertions with it, Router
  verifies with it.
- `TOKEN_ENCRYPTION_KEY` — Core signs sessions with it, Console verifies them.
  The Console README says it explicitly; a mismatch means every Console session
  is rejected as revoked.

---

## Phase 2 — Database schema

Router, Core, and Console each have their own schema. Apply them in numeric
order, and as the table owner, because the Router's `002` migration enables row
level security that the owner role bypasses.

```bash
cd orin-router-service
for f in migrations/0*.sql; do
  echo "== $f"; psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f orin-console/schema.sql
```

**Verify:**

```sql
SELECT table_schema, count(*) FROM information_schema.tables
 WHERE table_schema IN ('orin_router','orin_platform','console') GROUP BY 1;
```

You should see rows for `orin_router` and `console`. If `orin_router` is
missing, migration `001` did not run.

---

## Phase 3 — The Oracle VM

Full detail in the Router's `deploy/oracle/README.md`. The short version:

1. Create a VCN with a **public** subnet.
2. Launch `VM.Standard.A1.Flex`, 4 OCPU / 24 GB, Ubuntu 22.04 or 24.04.
3. Open ingress **22, 80, 443 (TCP) and 443 (UDP)** in the subnet security
   list. This is the step people miss — Oracle filters before the host does.
4. `ssh ubuntu@<ip>`, then `sudo bash deploy/oracle/bootstrap.sh`.
5. `cp deploy/oracle/router.env.example deploy/oracle/router.env`, fill it in,
   `chmod 600`.
6. `docker compose up -d --build`

**Verify:**

```bash
curl -fsS http://127.0.0.1:8080/health        # {"status":"ok",...}
bash deploy/oracle/smoke.sh                  # boots, checks, exits 0
```

Start in `ORIN_PROVIDER_MODE=fake`. It exercises the entire request path with
local fixtures and makes no outbound calls, so you prove the plumbing before
spending anything.

---

## Phase 4 — DNS

Only after `dig +short router.orinai.org` returns the VM's IP. Caddy cannot get
a certificate for a name that does not point here, and the failure mode is a
confusing Caddy error rather than a clear one.

| Type | Name | Value |
| --- | --- | --- |
| `A` | `router` | the VM's public IP |
| `A`/`ALIAS` | — | Vercel's apex value |
| `CNAME` | `www` | Vercel |
| `A`/`CNAME` | `chat`, `code`, `agent`, `mcp`, `console`, `tools`, `automate` | each Vercel project |

**Verify:**

```bash
dig +short router.orinai.org                  # the VM IP
curl -fsS https://router.orinai.org/health    # {"status":"ok"}
```

Keep Cloudflare on **DNS-only** (grey cloud) until TLS works. Turn the orange
cloud on afterwards and re-test streaming chat, because a proxied long-lived
response can behave differently.

---

## Phase 5 — Deploy the Vercel products

One Vercel project per repo, in this order, because later ones depend on
earlier ones answering.

| Order | Project | Repo | Notes |
| --- | --- | --- | --- |
| 1 | apex | `orin-ecosystem` | needs `ORIN_ROUTER_BASE_URL` |
| 2 | Core | `Orin-AI` | the shared secrets and the router host |
| 3 | Tools | `orin-tools` | needs the Core assertion secret |
| 4 | Console | `orin-console` | needs `TOKEN_ENCRYPTION_KEY` matching Core |
| 5 | MCP | `orin-mcp` | |
| 6 | Agent web | `orin-agent-web` | |
| 7 | Chat | `Orin-AI` | after Core, same project |

Each one: import the repo, add the environment variables, deploy, then add the
domain in **Settings → Domains**.

### Environment variables

**Core (`Orin-AI`)** — see `.env.example` for the full list. The ones that
block go-live if wrong:

```
DATABASE_URL                    TOKEN_ENCRYPTION_KEY          ORIN_SECRET_CODE
ORIN_SESSION_HASH_KEY           ORIN_SERVICE_KEY_ID
ORIN_ROUTER_SERVICE_SIGNING_KEY ← must equal the Router's
ORIN_TOOLS_ASSERTION_SECRET     ← must equal Tools'
ORIN_TOOLS_ASSERTION_AUDIENCE   ORIN_CORE_CLIENT_ID           ORIN_CORE_CLIENT_SECRET
ORIN_PROVIDER_MODE=live         BLOB_READ_WRITE_TOKEN
```

**Router** — `deploy/oracle/router.env`. **Tools** — `ORIN_PROVIDER_MODE`,
`ORIN_TOOLS_*` secrets, `UPSTASH_REDIS_*`. **Console** — `DATABASE_URL`,
`TOKEN_ENCRYPTION_KEY`, the two keyless limits.

**Apex** — `ORIN_ROUTER_BASE_URL=https://router.orinai.org`, and optionally
`ORIN_ROUTER_STATUS_KEY` so the status panel can show the live free-model count
as well as health.

---

## Phase 6 — Switch the Router to live

Only after fake mode has proven end to end on the real host.

1. Set `ORIN_PROVIDER_MODE=live`, then `docker compose up -d`.
2. Warm the catalog:
   ```bash
   curl -fsS -X POST https://router.orinai.org/api/internal/catalog/refresh \
     -H "x-orin-cron-secret: $CRON_SECRET"
   ```
3. Put that same call in cron so the six-hour cache never goes stale:
   ```
   17 * * * * curl -fsS -X POST https://router.orinai.org/api/internal/catalog/refresh -H "x-orin-cron-secret: YOUR_CRON_SECRET" >/dev/null
   ```
   This doubles as the periodic activity that keeps an idle Always Free VM from
   being reclaimed, if your tenancy's policy requires it.

**Verify — this is the important one.** Create a gateway key from the
dashboard, then:

```bash
curl -fsS https://router.orinai.org/v1/models -H "authorization: Bearer orin_..."
```

Every model id that is not one of the four aliases **must end in `:free`**.
That is the same rule the Router enforces internally, so if it ever does not,
stop and investigate before sending real traffic.

4. Optionally set `ORIN_PROVIDER_API_KEY` as the platform fallback. Leave it
   empty if every account brings its own key — Router then fails closed rather
   than spending your money.

---

## Phase 7 — End-to-end verification

Run these in order. Each one proves a different link in the chain.

```bash
# 1. Router is up and serving the free tier
curl -fsS https://router.orinai.org/health

# 2. The apex can see the router
curl -fsS https://orinai.org/api/router-status
#    expect reachable:true — this is the "front door" working

# 3. Tools search works with no key
curl -fsS "https://tools.orinai.org/api/search?q=orin" -o /dev/null -w '%{http_code}\n'

# 4. Tools browser use works with no key
curl -fsS -X POST https://tools.orinai.org/api/fetch \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com","maxChars":500}' -o /dev/null -w '%{http_code}\n'

# 5. Console rejects an unauthenticated listing (should be 401)
curl -s -o /dev/null -w '%{http_code}\n' https://console.orinai.org/api/sessions

# 6. Console creates a keyless session (should be 201)
curl -s -X POST https://console.orinai.org/api/sessions \
  -H 'content-type: application/json' -d '{"cols":100,"rows":30}'

# 7. Chat answers — sign in first, then from the browser
#    https://chat.orinai.org
```

If step 2 says `reachable:false`, the apex cannot reach the router. Check DNS
first, then the security list, then the container.

---

## Phase 8 — Smoke test the desktop and CLI

```bash
cd Orin-Code/orin-desktop-app && npm run app:build     # produces the installer
cd ../../orin-code-cli && npm pack --dry-run
cd ../../orin-code-vscode && npx vsce package
```

On a machine that has never signed in:

```bash
orin login          # opens the browser, device code, then stores the token
orin models         # must list only :free models plus the four aliases
orin run -l python -c "print(1)"   # reports execution is disabled — that is correct
```

**Verify:** `orin models` returns aliases plus only `:free` models. If a paid
model appears, stop — the gate is not being enforced on the path that matters.

---

## Rollback

```bash
cd /opt/orin/router/src
git checkout <previous-tag>
docker compose up -d --build
```

Database migrations are not rolled back automatically. Take a Neon branch
before applying `004` or later — `004` renames tables and is not trivially
reversible.

For the Vercel side, each project has instant rollback to the previous
deployment under **Deployments → ⋯ → Promote to Production**.

---

## Troubleshooting

| Symptom | Cause | Go to |
| --- | --- | --- |
| `curl https://router...` returns a Caddy error | DNS does not point at the VM | Phase 4, `dig` |
| SSH times out | Ingress 22 missing in the Oracle security list | Phase 3 step 3 |
| `No eligible free model is currently available` | Catalog empty or stale | Phase 6 step 2 |
| `Router failed.` in container logs | Unhandled server error | `docker compose logs router` — the server logs the real cause |
| Every Router request is 401 | `ORIN_ROUTER_SERVICE_SIGNING_KEY` differs on Core and Router | Phase 1 |
| Every Console session is "revoked" | `TOKEN_ENCRYPTION_KEY` differs on Core and Console | Phase 1 |
| `No upstream credential is available for this account` | No BYOK key and no platform key | Add a key, or set the platform key |
| Apex shows `reachable:false` but the router is fine | The apex's `ORIN_ROUTER_BASE_URL` is unset or wrong | Phase 5 |
| `npm ci` prints a usage dump | A git submodule is not initialised | Phase 0, `git submodule update --init --recursive` |
| Docker build fails with `tsc: not found` | `NODE_ENV=production` was set before the install | This is already fixed in the shipped Dockerfile; check you pulled the tag |

---

## What is still not automated

None of the following can be done from a repository, and each is a step you have
to take once:

- The Oracle account, VM, and public IP.
- The DNS records.
- Neon, Upstash, and Vercel projects.
- Applying the migrations.
- Setting the environment variables on each Vercel project.
- Creating the first gateway key and first account.

Everything after that is repeatable from this document.
