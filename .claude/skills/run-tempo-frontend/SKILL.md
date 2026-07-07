---
name: run-tempo-frontend
description: Build, run, and drive the tempo-frontend web app (TanStack Start + React, Vite dev server). Use when asked to start tempo-frontend, take a screenshot of its UI, log in and click through it, or verify a frontend change actually renders.
---

tempo-frontend is a TanStack Start / React web app served by Vite. `chromium-cli`
was not available in this environment, so driving it means launching the Vite
dev server, then driving a headless Chromium via the Playwright REPL at
`.claude/skills/run-tempo-frontend/driver.mjs` (same shape as `chromium-cli`:
pipe a script to stdin, get screenshots back).

**This app calls a live backend at `http://localhost:3000`** (hardcoded in
`src/services/*.ts`, not an env var) — see the sibling `tempo-api` repo's
`run-tempo-api` skill to bring that up first. Nothing here renders real data
without it.

All paths below are relative to `tempo-frontend/` (this skill's unit root).

## Prerequisites

- `tempo-api` running on `localhost:3000` with at least one user in its db
  (see `../tempo-api/.claude/skills/run-tempo-api/SKILL.md`).
- Node.js (verified with v24) and npm.
- Playwright's Chromium browser, downloaded once into the driver's own
  `node_modules` (kept separate from the app's `package.json` — see Setup).

## Setup

```bash
npm install                                        # app deps
cd .claude/skills/run-tempo-frontend && npm install && cd ../../..
npx --prefix .claude/skills/run-tempo-frontend playwright install chromium
```

The driver has its own tiny `package.json` (just `playwright`) inside the
skill directory so the app's own `package.json` doesn't need a Playwright
dependency.

## Build

Not needed to drive it locally — `npm run dev` runs Vite directly. For a
production-style build: `npm run build` (Cloudflare Worker output via
`@cloudflare/vite-plugin`).

## Run (agent path)

Start the dev server, then pipe commands to the driver:

```bash
(npm run dev > /tmp/tempo-frontend.log 2>&1 &)
for i in $(seq 1 30); do curl -sf http://localhost:8080 >/dev/null && break; sleep 1; done
tail -5 /tmp/tempo-frontend.log   # confirms "VITE ... ready" and the port (8080)

node .claude/skills/run-tempo-frontend/driver.mjs <<'EOF'
launch
nav /login
wait-for #email
fill #email ui-test@test.com
fill #password password123
click button[type="submit"]
wait-for text=Dashboard
ss 01-dashboard
console-errors
EOF
```

Screenshots land in `/tmp/shots/` (override with `SCREENSHOT_DIR`). The driver
reads one command per line from stdin and runs them strictly in order (a
heredoc works fine — no tmux needed for this). `console-errors` prints any
`console.error`/`pageerror` seen since `launch`.

There's no public registration route in the UI — create a login user via
`tempo-api` first: `curl -X POST http://localhost:3000/api/auth/register -H
'Content-Type: application/json' -d '{"name":"UI Test","email":"ui-test@test.com","password":"password123","role":"employee"}'`.

For iterative debugging instead of one batch heredoc, wrap the same driver in
`tmux` and `send-keys` one line at a time (not verified in this environment —
no `tmux` binary here — but the driver itself doesn't care how lines arrive
on stdin).

### Driver commands

| command | what it does |
|---|---|
| `launch` | launch headless Chromium |
| `nav <path-or-url>` | navigate (relative paths resolve against `http://localhost:8080`) |
| `ss [name]` | screenshot (full page) → `/tmp/shots/<name>.png` |
| `click <css-sel>` | click via Playwright locator |
| `click-text <text>` | click first element containing text |
| `fill <css-sel> <value>` | fill an input |
| `type <text>` / `press <key>` | keyboard input |
| `wait-for <css-or-text-sel>` | wait up to 15s for a selector (`text=...` works) |
| `eval <js>` | evaluate JS in the page, print JSON |
| `text [css-sel]` | print innerText of selector or whole body |
| `url` | print current page URL |
| `console-errors` | print collected console errors / page errors |
| `quit` | close the browser, exit |

## Run (human path)

```bash
npm run dev   # → http://localhost:8080, Ctrl-C to stop
```

## Test

```bash
npm run lint
```

No automated frontend test suite exists yet — `lint` plus the driver above is
the current verification path.

## Gotchas

- **The API base URL is hardcoded** to `http://localhost:3000/` in each
  `src/services/*.ts` file, not read from an env var — there's no way to point
  this frontend at a different API host without editing those files.
- **One `401` on `/api/users/me` on every login-page load is expected**, not a
  bug: the auth check runs on mount before you're logged in, gets a 401, and
  that's how the app decides to show the login form. Don't treat a single 401
  in `console-errors` right after `nav /login` as a failure signal — look for
  it recurring *after* a successful login instead.
- **`click-text` matching sidebar nav text can false-positive on `wait-for`.**
  E.g. `wait-for text=Weekly Report` resolves instantly because the sidebar
  link with that text is always present, even if the click that was supposed
  to navigate there hasn't actually landed yet. Prefer `nav <path>` directly,
  or wait for a selector unique to the destination page (e.g. its `h1`).
- **Piped/heredoc stdin delivers all lines before the first async command
  resolves** — the driver queues and awaits commands one at a time internally
  to avoid running `nav` before `launch` finishes; if you ever rewrite the
  input loop, keep that queuing or commands race.
- **No `tmux` in this environment** — the heredoc/batch pattern above is the
  verified path; tmux wrapping is standard for iterative use but untested here.

## Troubleshooting

- **`Cannot find module 'playwright'`**: you're running `node driver.mjs` from
  outside `tempo-frontend`, or skipped `npm install` inside the skill
  directory. Playwright lives in the skill's own `node_modules`, resolved
  relative to `driver.mjs`'s location.
- **Dashboard renders blank / stuck on "Loading..."**: `tempo-api` isn't
  running on port 3000, or the db has no matching user — check
  `curl http://localhost:3000/api/users/me` returns 401 (server up, just
  unauthenticated) rather than connection refused.
