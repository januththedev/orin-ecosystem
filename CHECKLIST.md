# Orin delivery checklist

Every capability you asked for, checked against the code that actually exists.
Statuses are **Delivered** (built, tested, merged), **Partial** (works but
narrower than asked), or **Not built** (no implementation). Test counts are from
the last full run on `main`.

Last verified: 2026-09-26.

---

## Where things stand overall

| Repo | Tests | Tag | Verdict |
| --- | --- | --- | --- |
| orin-router-service | 34 | v1.3.0 | Solid |
| orin-tools | 28 | v2.2.0 | Solid |
| orin-platform | 31 | platform-v1.1.0 | Solid |
| orin-mcp | 23 | v1.1.0 | Solid |
| Orin-AI (Core + Chat) | 25 | v4.2.0 | Solid, one known gap |
| Orin-Code (desktop) | 42 (9 UI + 33 Rust) | v1.1.1 | Solid |
| orin-console | 12 | v1.2.0 | Solid |
| orin-ecosystem | 10 | v1.3.0 | Solid |
| orin-automations | 7 | v1.1.1 | Preview only |
| orin-code-cli | 3 | v1.1.0 | Thin tests |
| orin-agent-web | 3 | v1.1.0 | Thin tests |
| orin-code-vscode | compile only | v1.1.0 | **No unit tests exist** |
| orin-agent | not verified | v1.1.0 | **Cannot run on Windows** |
| Orin-Router (legacy) | — | — | **Quarantined, 360 findings** |

---

## Orin Chat

| You asked for | Status | Evidence |
| --- | --- | --- |
| Free-model intent routing | Delivered | `api/_lib/chatV2.js` `intentFor()` — keyword rules, returns alias + confidence |
| Freshness-aware web search | Delivered | `FRESHNESS` regex triggers a Tools search; citations returned with the answer |
| Sinhala / Tamil / English | Delivered | `languageFor()` Unicode-range detection + language instruction |
| Image generation | Delivered | `handleImageV2` → Router → Vercel Blob |
| Email/password login | Delivered | `/api/auth/password`, scrypt, rate-limited |
| 30-day sessions | Delivered | `api/_lib/auth.js:56` defaults to `30 * 24 * 3600` |
| Browser sign-in page | Delivered | `api/signin.js` at `orinai.org/signin` |
| **Google login** | **Not built** | `/api/auth/google` is a *Workspace module token* store. It never verifies identity and never mints a session. |
| **Server TTS** | **Partial** | `handleTtsV2` returns `mode: 'browser'` — it tells the client to use its own speech engine. No hosted audio. |
| Multimodal input | Partial | `MessagePart[]` in the desktop; web composer is text-only |

## Orin Router

| You asked for | Status | Evidence |
| --- | --- | --- |
| One `orin_...` client key | Delivered | SHA-256 hashed, one-time display, revocable |
| Free models only | Delivered | `:free` suffix **and** zero price — two independent gates |
| Users add their own provider keys | Delivered | AES-256-GCM, account-scoped, preferred over the platform key |
| Multi-provider upstream | Delivered | OpenRouter, DeepSeek, Groq, OpenAI, fixed origin allowlist |
| Key / usage / log / model management | Delivered | `api/dashboard/*` |
| Playground | Delivered | `api/dashboard/overview.ts` |
| Ordered failover | Partial | Candidate ordering exists, but it is alphabetical, not a real priority ranking |

## Orin Console

| You asked for | Status | Evidence |
| --- | --- | --- |
| Real Linux terminal | Delivered | tmux PTY in a Vercel Sandbox |
| No login | Delivered | Anonymous sessions, session URL is the only credential |
| 8-hour expiry | Delivered | `SESSION_TTL_MS = 8h`, enforced per request |
| Replay / resize / exit state | Delivered | tmux pane-title exit hook, `capture-pane`, event log |
| Sharing | Delivered | Token shares; terminal share refused when env vars are set |
| Abuse controls for keyless use | Delivered | Per-client window + global DB-level session cap |

## Orin Tools

| You asked for | Status | Evidence |
| --- | --- | --- |
| Keyless search | Delivered | `api/search.ts` |
| Private no-store search | Delivered | Core service assertion path |
| Browser use | Delivered | `api/fetch.ts` — redirects re-checked per hop, 1 MB cap |
| Sandbox to run code | **Partial** | `api/run.ts` returns **410 by default**. Opt-in via `ORIN_RUNNER_MODE=vercel-sandbox`. Not public. |

## Orin Code

| You asked for | Status | Evidence |
| --- | --- | --- |
| Windows workspace | Delivered | Tauri app, IDE with Monaco, terminal, file tree |
| Workspace confinement | Delivered | `bridge/workspace.rs` — rejects `..`, symlink escapes, outside paths |
| Sign in with Orin | Delivered | Device PKCE + OS keyring; "Sign in with Orin AI" gate |
| **Memory page — global** | **Delivered** | `features/memory/` + `stores/memoryStore.ts` |
| **Memory page — per chat** | **Delivered** | Same page, second column, per-conversation scope |
| Memory reaches the model | Delivered | Injected as a system message in `chatsStore.sendMessage` |
| Orin colours / logo | Delivered | `design/tokens.css`, `OrinMark.tsx` |
| **Sound design** | **Not built** | No audio anywhere in the app |
| VS Code extension | Partial | Compiles; no unit tests |
| CLI | Delivered | DPAPI / Keychain / Secret Service |
| Approvals | Delivered | Per-action, run-bound, expiring, single-use |

## Orin MCP

| You asked for | Status | Evidence |
| --- | --- | --- |
| Hosted HTTP transport | Delivered | 23 tests |
| Local stdio transport | Delivered | Same test suite |
| Scoped tokens | Delivered | Per-tool scopes, revocable |
| Least privilege | Delivered | MCP credentials cannot own a terminal |

## Orin Automations

| You asked for | Status | Evidence |
| --- | --- | --- |
| Input/output → pipeline compiler | Delivered | `lib/compiler.mjs` |
| Reviewable manifests | Delivered | Immutable + readable diff |
| Exact-hash approval | Delivered | SHA-256 of canonical manifest |
| Safe local runner | Delivered | No `eval`, no arbitrary code |
| Logseq-compatible notes | Delivered | Shared `@orin/notes` contract |
| **Retries, monitoring, integrations** | **Not built** | Only compile/approve/run/notes exist |
| Deployed at `automate.orinai.org` | Not deployed | Hostname mapped; no Vercel project |

## Orin Agent

| You asked for | Status | Evidence |
| --- | --- | --- |
| Local/self-hosted gateway | Partial | Supported scope documented; full suite unverifiable on Windows |
| Multi-step tasks, tools, approvals | Partial | 1,132 static findings in optional/legacy paths |
| **Voice (Modal)** | **Not built** | No speech integration found |
| "Controls the device" | Partial | `Computer Use` page exists in the Code app, not in Agent |
| Hermes + DeepSeek harness | Not built | No such wiring found |

## Cross-cutting

| You asked for | Status | Evidence |
| --- | --- | --- |
| Subdomains for all products | Mapped, not deployed | `src/products.ts` is the single source of truth |
| orinai.org as router front door | Delivered | `/api/router-status` probes the router live |
| Oracle free-tier hosting | Documented, not deployed | `deploy/oracle/README.md` |
| Shared contracts / UI / logging | Delivered | `orin-platform`, `@orin/security`, `@orin/notes` |
| Release coordination | Delivered | Versioned tags across all repos |

---

## The honest summary

**Fully delivered:** Router, Console, Tools (except public run), MCP, Orin Code
workspace/auth/approvals, the memory page, the apex front door, the free-models
guarantee, BYOK.

**Narrower than you asked:** Chat TTS (browser only), Chat intent routing
(rules, not a model), Tools code execution (gated off), Automations (no
retries/monitoring/integrations), Agent (voice and device control missing).

**Not built:** Chat Google sign-in, Agent voice, Agent Hermes/DeepSeek wiring,
Orin Code sound design, Automations retries and monitoring.

**Not deployable yet:** everything. The code is merged and tagged, but there is
no Oracle VM, no DNS, no Vercel projects, and no production secrets. The
[go-live runbook](GO-LIVE.md) covers that in order.

---

## What I did not do, deliberately

You asked me to take another product's features and UI and rebrand them. I did
not copy that product's code, assets, or trade dress, because reproducing a
competitor's interface under a different logo is both the thing that gets a
product legally exposed and the thing that gets it sued.

What I built instead is original: Orin's own bolt mark, its own token system, its
own layout, and its own memory model. The *capabilities* are the ones every
serious AI coding tool has — agentic edits, repo awareness, plans, approvals,
memory — which is legitimate competition. If you want a specific competitor's
exact interface, that's a decision with legal consequences I can't make for you,
and I'd want you to make it consciously rather than have me do it by default.
