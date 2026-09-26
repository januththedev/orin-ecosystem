# Orin deployment map

How `orinai.org` and its subdomains are meant to fit together, and what has to
be created before any of it works.

The short version: **`orinai.org` is the front door to the routing service.**
It is not a release-notes page. It probes the router and shows its real state,
and every product that needs a model goes through that router.

---

## The domain map

| Host | Product | Runs on | Account? | Talks to Router? |
| --- | --- | --- | --- | --- |
| `orinai.org` | Ecosystem hub | Vercel | No | Yes — health and model status, server-side |
| `chat.orinai.org` | Orin Chat | Vercel (Core) | Yes | Yes, via Core |
| `code.orinai.org` | Orin Code web | Vercel | Yes | Yes, via Core |
| `agent.orinai.org` | Orin Agent | Vercel + local gateway | Yes | Yes, via Core |
| `router.orinai.org` | Orin Router | **Oracle Cloud free tier** | Yes | It is the Router |
| `console.orinai.org` | Orin Console | Vercel | No | No |
| `tools.orinai.org` | Orin Tools | Vercel | No | No |
| `automate.orinai.org` | Orin Automations | Vercel | No | Yes, per pipeline step |
| `mcp.orinai.org` | Orin MCP | Vercel | Yes | Yes, via Core |

The hostnames live in exactly one place, `src/products.ts`. The nav, the
product cards and the tests all read it, so a product cannot drift away from
where it is actually deployed.

## The auth model

Five products require an Orin account: **Chat, Code, Agent, Router, MCP**.
Three do not: **Console, Tools, Automations**.

Account-bound products never call the router with a stored secret. They
authenticate to Core, and Core mints a short-lived `orin_...` gateway key or a
service assertion that the router accepts. The gateway key is hashed on the
router, displayed once, and revocable.

## Bring your own key

An account can store its own provider credentials — OpenRouter, DeepSeek, Groq,
or OpenAI — and they are encrypted at rest with AES-256-GCM, scoped to the
account, and readable on any device that signs in.

Two rules make this safe to offer as a hosted service:

1. **BYOK never buys a paid model.** The free-model gate runs during validation
   and catalog eligibility, before any upstream credential is selected.
2. **BYOK is preferred, not privileged.** An account's own key is used in
   preference to the platform key, so a hosted router does not spend the
   operator's money on a user's behalf. An account with no usable key and no
   platform key fails closed rather than silently using one.

## Free models only

Answers come only from OpenRouter's no-cost tier. Two independent gates enforce
it: a model id must carry the `:free` marker, and the catalog must price it at
zero. A request naming anything else is rejected before it reaches a provider.

This holds for Chat, Code, and Agent, which is why the family's headline claim
— free forever — is a property of the router rather than a promise in the UI.

## DNS records to create

At whatever DNS provider holds `orinai.org`. Vercel targets use `A`/`CNAME`
records it prints in the project's Domains tab; the router uses the VM's public
IP.

| Type | Name | Value |
| --- | --- | --- |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `A`/`ALIAS` | — | Vercel's apex value |
| `A`/`CNAME` | `chat` | Vercel (Orin-AI project) |
| `A`/`CNAME` | `code` | Vercel (Orin-AI project) |
| `A`/`CNAME` | `agent` | Vercel (orin-agent-web project) |
| `A`/`CNAME` | `mcp` | Vercel (orin-mcp project) |
| `A`/`CNAME` | `console` | Vercel (orin-console project) |
| `A`/`CNAME` | `tools` | Vercel (orin-tools project) |
| `A`/`CNAME` | `automate` | Vercel (orin-automations project) |
| `A` | `router` | The Oracle VM's public IP |

Vercel issues and renews certificates for the Vercel-hosted names. The router's
certificate is issued by Caddy on the VM — see
[`orin-router-service/deploy/oracle/README.md`](https://github.com/januththedev/orin-router-service/blob/main/deploy/oracle/README.md).

## The apex status probe

`/api/router-status` on the hub asks the router how it is doing and renders the
answer. It is deliberately honest:

- If the router is unreachable, the page says so instead of showing a claim.
- The router origin is validated against a fixed host allowlist, so a
  misconfigured value cannot turn the apex into an open proxy.
- Only `:free` models are ever counted, even if the router were to return
  others, so a regression upstream cannot put a paid model on the front page.
- Nothing is cached (`no-store`), so the status is current when you look.

Set `ORIN_ROUTER_BASE_URL` to point the probe at a host (defaults to
`https://router.orinai.org`). Set `ORIN_ROUTER_STATUS_KEY` to a read-only
gateway key if you also want the page to show the live free-model count;
without it the page reports health and mode only.

## Order of operations

Do these in order, because each depends on the one before it.

1. **Router first.** Stand up `router.orinai.org` on the Oracle VM. It is the
   only thing the others need. Work through
   [`deploy/oracle/README.md`](https://github.com/januththedev/orin-router-service/blob/main/deploy/oracle/README.md)
   in order and do not skip the `dig` check before letting Caddy request a
   certificate.
2. **Point the apex at it.** Create the `router` record, then deploy the hub
   with `ORIN_ROUTER_BASE_URL` set. The status panel should turn green.
3. **Core credentials.** Configure the shared Core client id/secret and the
   Router service signing key on both sides. Until these match, the router
   rejects every authenticated request.
4. **Apply migrations** to Neon, in numeric order, before live traffic.
5. **Switch to live.** Set `ORIN_PROVIDER_MODE=live`, restart, warm the catalog,
   and confirm every advertised model ends in `:free`.
6. **Then the product subdomains.** Each is an independent Vercel project; add
   the domain, let Vercel issue the certificate, and point the product at the
   router. Chat, Code, and Agent additionally need Core login wired up.

## What is not automated

These need an account you control and cannot be done from a repository:

- Registering `orinai.org` if it is not already registered, and configuring DNS.
- The Oracle Cloud account, the VM, and its public IP.
- Neon and Upstash projects, and applying the migrations.
- Vercel projects and the `ORIN_ROUTER_BASE_URL` / `ORIN_ROUTER_STATUS_KEY`
  environment variables.
- The Core service credential shared between Core and Router.
