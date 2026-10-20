# End-to-end checks

Each `*.test.mjs` drives the demo in a headless Chromium (via `playwright-core`) the way a person would (clicking, typing, switching "View as") and prints one `PASS` or `FAIL` line per check. They start from fresh demo data (they clear localStorage first).

```bash
pnpm test:e2e                 # every suite (~4–5 min); starts the dev server on :5199 if needed
pnpm test:e2e inventory       # suites whose file name contains "inventory"
BASE_URL=https://darthmuzammil.github.io/WhatsApp-firstCRMDesignDirections/ pnpm test:e2e   # the live site
```

First time on a new machine: `pnpm exec playwright-core install chromium`.

| Suite | Covers (spec section) |
|---|---|
| `ux-basics` | Back to origin, focus return, reset confirmation, phone details sheet (§2, §3.2) |
| `shortcuts` | Sidebar Add lead, Due today → chat, toast position (§2, §3.1) |
| `roles-and-team` | Roles, View as, visibility, masking, reassign, escalations, team, settings (§3.8–§3.10) |
| `lead-sources` | Sources screen, simulated arrivals, routing (§3.11) |
| `chat-automation-and-ai` | Auto-reply, qualification, templates, 24 h window, AI drafts/score/digest, chat header, chat export (§3.2, §3.6) |
| `lead-record` | Overview/Timeline/Notes, brief editing, tags, duplicate check (§3.2, §3.7) |
| `visits` | Visit flow, refused/verified check-ins, unverified check-in at an unpinned listing, outcomes (§3.12) |
| `attendance` | Office/field check-in, register, corrections (§3.13) |
| `leave` | Balances, apply, approve with cover, team calendar (§3.13) |
| `performance` | My performance, leaderboard, scorecard, insights (§3.14) |
| `follow-ups` | Follow-ups in time order, Remind me from a chat, Add reminder with a buyer picker, Coming up, phone chat bar (§3.5) |
| `channel-partner` | M14 brokerage receivables (Today card, strip and charts, booking detail with tax lines, reminders, record payment + undo, invoice numbering, manager and sales views) developer registrations (counts, banner, PAN, conflict, renew, won as a booking), launch broadcasts (audience, RERA, preview and cost, scripted send, replies, manager and sales views) and group capture (paste, broker numbers, listings, duplicates, share sheet), phone layouts (§3.17–§3.19, §8.17) |
| `deal-closing` | Won/Lost, split, reopen, move back, drag and drop (§3.3) |
| `offer-history` | Dated offers, stale flag, token/agreement dates (§3.2, §3.3) |
| `inventory` | Listings, add/edit, address and location pin (demo map, who may pin, audit), owner masking, matches, share flow (§3.4) |
| `notifications-and-audit` | Bell, notifications per person, audit log, CSV export (§3.15) |
| `guided-demo` | The 12-step presenter flow and the M14 bonus (money developers owe you) at desktop and phone width (§3.16) |
| `layout-audit`, `layout-audit-manage` | Every main screen at 1440/900/390 px: no text under 11 px, no sideways overflow, phone tap targets ≥ 36 px, no console errors |

When you change a flow, update the suite that covers it in the same commit. Screenshots land in `tests/e2e/screenshots/` (git-ignored).
