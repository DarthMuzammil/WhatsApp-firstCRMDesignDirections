# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

Daira is a clickable client-demo prototype of a WhatsApp-first CRM for independent real-estate brokers in India. There is no backend: all data is seed data plus user actions saved in localStorage.

- `src/main.tsx` - React entrypoint. Imports `src/index.css` **before** `App` so component styles can override global ones. Keep that order.
- `src/App.tsx` - App shell. Owns the current view, the open lead, modals (add lead, call picker, call) and toasts. Renders one view at a time.
- `src/data/demo.ts` - All seed data and types: leads, properties, tasks, recordings, pipeline stages, demo metrics. Change demo content here.
- `src/state/useDemoStore.ts` - The single store hook. Persisted state, derived numbers (unread count, active value, commission) and every action (move stage, schedule visit, send message, reset demo). Views receive `store` as a prop and never touch localStorage directly.
- `src/lib/` - Small helpers: `storage.ts` (localStorage hook, key prefix `daira:v2:`), `format.ts` (dates, money, durations), `useEscapeKey.ts`.
- `src/components/` - Shared UI: `AppNavigation` (desktop sidebar, phone top bar and tab bar), `navigation.ts` (nav items and the `View` type), `Avatar`, `LeadRow`, `PropertyCard`, `AccountMenu` (reset demo data), `Toast`, `Icon` (inline SVG icon set).
- `src/views/` - One file per screen: `TodayView`, `ChatView` (chat + lead detail panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`.
- `src/modals/` - `AddLeadModal`, `CallPicker`, `CallModal`.

## Product spec (required)

`PRODUCT_SPEC.md` describes what the prototype does right now. **Any change to features, workflows, screens, seed data, saved state or UI copy must update `PRODUCT_SPEC.md` in the same commit**, including a dated line in its Changelog (§9). If the code and the spec disagree, fix whichever is wrong before finishing. Read the spec before changing behaviour so you don't break a documented workflow.

## Conventions

- Every component has a co-located `.css` file with the same name, imported at the top of the component. Global tokens and shared classes (`.btn`, `.card`, `.page-head`, `.stat-strip`, `.segmented`, `.search-field`, `.empty-state`, `.heat`, `.eyebrow`) live in `src/index.css`.
- Use the CSS variables in `src/index.css` for colour and type. Font sizes come from the `--fs-*` scale; 11px (`--fs-meta`) is the minimum and is only for timestamps and badges.
- Breakpoints: phone `max-width: 760px`, tablet `max-width: 1100px`. On phones every tappable control is at least 44px (`--tap`).
- `Avatar` renders a `<span class="avatar">`. Layout selectors like `.parent > span` must use `span:not(.avatar)` or they will stretch the avatar.
- When a stored data shape changes, bump the `daira:v2:` prefix in `src/lib/storage.ts` so old saved data is ignored.
- Verify changes with `npx tsc --noEmit -p .` and `npx vite build`, then check the phone (390px), tablet (900px) and desktop (1440px) layouts.

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Tailwind is available but this app uses plain CSS files (see Conventions); follow that pattern rather than mixing in utility classes. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.
