# Porting ZCode functionality into Orin Code

What "the entire ZCode functionality, with Orin's skin" actually means as work,
in the order it should be done. ZCode is Apache-2.0, so all of this is permitted;
the constraint is the work itself, not the licence.

Reference material is vendored at `Orin-Code/vendor/zcode/` with its
`LICENSE`, `NOTICE.md`, `THIRD-PARTY-NOTICES.md` verbatim and a
`MODIFICATIONS.md` recording what we took and what we did not.

**ZCode is a pnpm monorepo requiring Node 24.14 and pnpm 10.33.** Orin Code is a
Tauri + React app. A wholesale fork would replace everything Orin Code is —
workspace confinement, Core device auth, the memory page, working Computer Use.
So this plan ports capability, not code.

---

## Already done

| Capability | State |
| --- | --- |
| Calm, dense operational layout | Orin's own, informed by `DESIGN.md` |
| Dedicated `text-ui-*` type scale | `design/tokens.css` — interface type never scales the root font |
| Light and dark token sets | `--bg` / `--panel` / `--accent` with a `data-theme` switch |
| Memory: global and per chat | Delivered, injected into the model context |
| Run-bound approvals | Delivered, stricter than upstream's |
| Workspace confinement | Delivered, upstream has no equivalent |
| Sound cues | Delivered, synthesised not sampled |
| Long-chat performance | Windowed rendering + memoised rows |
| Always-on-top status pets | Delivered |

## Next, in order

### 1. The `text-ui-*` scale, taken properly from `DESIGN.md`

ZCode's design system makes the type scale a *mandatory repository-wide
constraint*: UI must use `text-ui-xl|xlg|base|caption|sm|xs`, must not use
Tailwind's `text-base`/`text-sm`/`text-xs` for UI, and must never implement font
scaling by mutating the root font size. Orin Code has the tokens but not the
enforcement.

- Map every existing UI font size onto the scale.
- Add a lint rule that rejects off-scale sizes in UI components.
- Scale via a single `--ui-font-size` custom property only.

**Why first:** it is the one upstream rule that, once enforced, makes every
later screen consistent for free.

### 2. Surface and token completeness

ZCode defines `--color-brand`, `--color-icon-blue`, `--color-accent`, plus
`--color-icon-*` descriptors for file-type icons. Orin Code has a smaller set.
Port the token *structure* while keeping Orin's palette values.

### 3. Plugin and MCP marketplace surface

ZCode ships a plugins marketplace (`zai-org/zcode-plugins`) and MCP support
with scoped tokens. Orin Code has `ConnectorsPage` and MCP credentials in Core.
Unify them into one surface with the same scoping model.

### 4. Session lifecycle hooks

ZCode supports `SessionStart`, `UserPromptSubmit`, `PreToolUse`,
`PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Stop`. Orin Code has
approval interception but not the hook model. This is the biggest single piece
of work and should be done with the approval system in view, not bolted on.

### 5. Sub-agents, workflows, background tasks

ZCode runs sub-agents, workflows, and scheduled/background tasks. Orin Code's
agent runs single-shot with approvals. This needs a queue and a scheduler, and
it must respect the existing approval model — a background task that can write
files unattended is exactly what the current run-bound approvals exist to
prevent.

### 6. In-app browser with browser use

ZCode has a real embedded browser with click, type, upload, download, screenshot.
Orin Tools now has keyless `POST /api/fetch`. The in-app browser is a client for
that plus a real browser engine — a large piece, and the one with the clearest
abuse surface.

---

## Deliberately not ported

| Upstream | Why |
| --- | --- |
| Computer Use package | Upstream's is a non-functional placeholder. Ours works; porting theirs would be a regression. |
| Shared agent adapter | Upstream ships **no OS-level sandbox**, per its own NOTICE. Ours runs inside a Rust-enforced workspace boundary. |
| `yolo` default for non-interactive `--prompt` | Upstream defaults unattended CLI runs to full permission. That conflicts with run-bound approvals. |

---

## Compliance obligations, ongoing

- `vendor/zcode/LICENSE`, `NOTICE.md`, `THIRD-PARTY-NOTICES.md` stay verbatim.
- `vendor/zcode/MODIFICATIONS.md` is updated whenever derived work lands.
- The About screen credits Z.ai / Zhipu AI.
- No Z.ai or ZCode mark appears anywhere in the product surface (Apache-2.0 §6
  grants no trademark rights).
- A test asserts the licence files are present and unmodified, so compliance
  cannot rot silently.
