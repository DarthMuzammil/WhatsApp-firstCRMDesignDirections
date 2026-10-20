# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

Daira is a clickable client-demo prototype of a WhatsApp-first CRM for independent real-estate brokers in India. There is no backend: all data is seed data plus user actions saved in localStorage.

- `src/main.tsx` - React entrypoint. Imports `src/index.css` **before** `App` so component styles can override global ones. Keep that order.
- `src/App.tsx` - App shell. Owns the current view, the open lead, the screen a chat was opened from (`chatOrigin`, used by Back and the nav highlight), modals (add lead, call picker, call) and toasts. Renders one view at a time.
- `src/data/demo.ts` - Seed data and types for leads, properties, tasks, recordings, pipeline stages and demo metrics. Change demo content here.
- `src/data/team.ts` - The brokerage's people, teams, roles and the "View as" personas.
- `src/data/sources.ts` - Lead sources (portals, ads, offline) and the buyer pool for simulated arrivals.
- `src/data/visits.ts` - Visits, offices and check-in limits.
- `src/data/attendance.ts` - Attendance codes, seed history, today's records and corrections.
- `src/data/leave.ts` - Leave types, allowances, seed requests and holidays.
- `src/data/inventory.ts` - Listings (availability, listing agent, owner contact) and `matchesForLead` (scored matches with reasons). Use `store.properties` / `store.findProperty`, never `SEED_PROPERTIES`, in screens.
- `src/data/notifications.ts` - Notification and audit-log types and seed entries.
- `src/data/deals.ts` - Deals: dated offer history (`latestOffer`, `staleOfferDays`), token and agreement dates, documents, commission split, lost reasons.
- `src/data/performance.ts` - Generated monthly performance, targets and insight data.
- `src/data/templates.ts` - WhatsApp templates, 24-hour window, auto-reply and qualification questions.
- `src/state/useDemoStore.ts` - The single store hook. Persisted state, derived numbers (unread count, active value, commission) and every action (move stage, schedule visit, send message, reset demo). Views receive `store` as a prop and never touch localStorage directly.
- `src/lib/` - Small helpers: `ai.ts` (demo AI text; outputs are suggestions people confirm, never auto-sent), `location.ts` (one-off location readings and distance; never add background tracking), `permissions.ts` (role → permissions, `canSeeLead`), `storage.ts` (localStorage hook, key prefix `daira:v6:`), `format.ts` (dates, money, durations, `maskPhone`), `csv.ts`, `useEscapeKey.ts`.
- `src/components/` - Shared UI: `DemoGuide` (the guided demo: one store action per step; keep it working when you change a flow it drives), `AppNavigation` (desktop sidebar, phone top bar and tab bar), `navigation.ts` (nav items and the `View` type), `Dialog` (the one modal/sheet/full-screen shell), `Avatar`, `HeatBadge`, `LeadActions`, `LeadRow`, `LeadTimeline`, `LeadNotes`, `LeadTags`, `IncomingLeadBanner`, `LocationControl`, `BarList`, `PropertyCard`, `AccountMenu` (reset demo data, with confirmation), `NotificationBell`, `Toast`, `Icon` (inline SVG icon set).
- `src/views/` - One file per screen: `TodayView`, `ChatView` (chat + lead detail panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`, `VisitsView`, `AttendanceView`, `ReportsView`, `EscalationsView`, `LeadSourcesView`, `TeamView`, `SettingsView`, `AuditView`.
- `src/modals/` - `AddLeadModal`, `EditLeadDialog`, `ScheduleVisitDialog`, `TemplateDialog`, `AssignDialog` (shared people picker), `DealDialog` (offer + split, `LostDialog`), `PropertyDialog`, `ShareDialog` (share listings on WhatsApp), `CallPicker`, `CallModal`.

## Product spec (required)

`PRODUCT_SPEC.md` describes what the prototype does right now. **Any change to features, workflows, screens, seed data, saved state or UI copy must update `PRODUCT_SPEC.md` in the same commit**, including a dated line in its Changelog (§9). If the code and the spec disagree, fix whichever is wrong before finishing. Read the spec before changing behaviour so you don't break a documented workflow.

## Conventions

- Every component has a co-located `.css` file with the same name, imported at the top of the component. Global tokens and shared classes live in `src/index.css`.
- **Tokens only.** Raw colours (hex) may appear only in the `:root` block of `src/index.css`. Everywhere else (component CSS and inline styles) use variables: colour (`--ink`, `--muted`, `--primary`, `--success-*`, `--navy-*` …), spacing (`--space-half`, `--space-1` … `--space-10` on a 4px grid), radius (`--radius-xs` … `--radius-xl`, `--radius-pill`), shadow (`--shadow-*`) and font size (`--fs-*`; 11px `--fs-meta` is the minimum, for timestamps and badges only). Need a new colour? Add a named token to `:root` first. Fixed element sizes (e.g. a 36px avatar) may stay in px.
- **Contrast.** Every text colour token passes WCAG AA (4.5:1) on the surfaces it is used on. Keep it that way when adding or changing colour tokens.
- **Reuse shared pieces, don't copy them:**
  - `components/Dialog` for every modal, sheet or full-screen overlay (backdrop, Escape, click-outside, focus trap and focus return are built in)
  - `components/HeatBadge` for Hot/Warm/New
  - `components/LeadActions` for Shortlist / Visit / Matches
  - `firstName()` and `initialsFor()` in `src/data/demo.ts`
  - Shared CSS classes in `src/index.css`: `.btn*`, `.card`, `.page-head`, `.stat-strip`, `.segmented`, `.chip-row` / `.chip`, `.count-badge`, `.status-dot`, `.icon-badge`, `.is-done`, `.inline-feedback`, `.form-error`, `.ai-chip`, `.search-field`, `.empty-state`
- Hover-only effects (lifts, zooms) go inside `@media (hover: hover)` so they don't stick on touch screens.
- **Charts:** use `components/BarList` (one series, one colour = `--primary`, no legend, bars ≤ 24 px with `--radius-mark` ends, value at the tip, tooltip on hover and focus) and put a table view next to any chart that compares people. Never a dual axis, never a colour per bar for unordered categories. Validate any new chart colour with the dataviz skill's `validate_palette.js`.
- Breakpoints: phone `max-width: 760px`, tablet `max-width: 1100px`. On phones every tappable control is at least 44px (`--tap`).
- `Avatar` renders a `<span class="avatar">`. Layout selectors like `.parent > span` must use `span:not(.avatar)` or they will stretch the avatar.
- When a stored data shape changes, bump the `daira:v6:` prefix in `src/lib/storage.ts` so old saved data is ignored.
- **Roles and visibility:** never filter leads or hide features by checking a role name. Use `store.viewerCan(permission)` and the already-filtered `store.leads` / `store.tasks` / `store.recordings`. Show phone numbers through `store.displayPhone()` so masking applies. Any new action that changes a lead should also write to the activity log (the store's `log()` helper) so it appears on the lead's timeline; pass `SYSTEM_ID` for things the product does by itself. Inside the store, use `pushNotification()` to tell other people about something that concerns them and `recordAudit()` for changes the Owner should be able to trace (reassignments, team, settings, listings, deals, exports). Inside React state updaters, never read mutable counters: compute ids (e.g. with `nextId()`) before calling the setter. New Manage screens go in `NAV_ITEMS` with a `requires` permission.
- Verify changes with `npx tsc --noEmit -p .` and `npx vite build`, then check the phone (390px), tablet (900px) and desktop (1440px) layouts.

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Tailwind is available but this app uses plain CSS files (see Conventions); follow that pattern rather than mixing in utility classes. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.
