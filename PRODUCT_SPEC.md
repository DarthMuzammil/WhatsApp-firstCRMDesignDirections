# Daira: Product Spec (living document)

> **What this is:** the single source of truth for what the prototype does *right now*: screens, workflows and rules. It's not a plan. Plans and ideas go in the Backlog section at the end.
> **Who updates it:** whoever changes the app (person or AI) updates this file in the same commit as any feature, workflow, data or UI change (see `AGENTS.md`). If the code and this doc disagree, that's a bug in one of them.
>
> **Status labels:** ✅ Works (interactive, state changes) · 🎭 Simulated (looks real, but scripted or fixed) · 🧱 Static (hard-coded display only)

---

## 1. Product in one paragraph
Daira is a WhatsApp-first CRM for independent real estate brokers and small brokerages (2–5 people) in India, starting with Bengaluru. The broker works from their phone: leads arrive, conversations happen on WhatsApp, matching homes get shared, visits are planned and follow-ups are kept. All of it happens in one place instead of across WhatsApp, Excel and a paper diary. This repo is a **UI-only prototype** for customer demos. There is no backend; data is seeded in code and changes are saved in the browser's localStorage.

**Persona in the prototype:** Arjun Khanna, independent broker, Indiranagar.

**Differentiators the product must make obvious** (from the research PRD):
1. Speed to lead: instant WhatsApp reply and qualification for portal leads.
2. Shared or stale lead awareness: portals sell one lead to many brokers.
3. Rule-based property matching, shared on WhatsApp in one tap.
4. A "Today" view of the broker's day: visits, follow-ups, cold leads.
5. Mobile-first and offline-tolerant, with simple INR pricing.

> Differentiators 1, 2 and 5 are **not in the UI yet**, and 3 and 4 are partial. See the Backlog.

---

## 2. Navigation & layout
Layouts: **phone** ≤ 760px, **tablet** 761–1100px, **desktop** > 1100px. Every tappable control on phones is at least 44px.

| Area | Desktop / tablet | Phone |
|---|---|---|
| Brand + status | Sidebar with Daira logo (tap → Today) | Top bar: logo, "● WhatsApp connected" 🧱, **AK** avatar (account menu), **+** add lead |
| Main nav | Sidebar: **Today** (unread-message badge), **Pipeline**, **Properties**, **Follow-ups** (tasks-left badge), **Calls** | Bottom tabs: **Inbox** (unread badge), **Pipeline**, **Homes**, **Tasks**, **Calls** |
| Progress card | "Today's progress" ✅: buyers awaiting a reply · follow-ups left, with a progress bar of completed tasks. Says "You're all caught up" only when both are zero. | — |
| Account menu | "⋯" next to the user card → **Reset demo data** ✅ (asks to confirm first) | AK avatar → **Reset demo data** ✅ (asks to confirm first) |

⚠️ Names differ between desktop and phone (Today/Inbox, Properties/Homes, Follow-ups/Tasks). Pick one set.

While a chat is open, the nav keeps the screen it was opened from highlighted.

Toasts confirm actions at the bottom of the screen for 2.6 s. Dialogs close with **Escape** or by tapping outside, keep keyboard focus inside while open, and return focus to the button that opened them. On phones, pickers and lead details open as bottom sheets.

---

## 3. Screens & workflows

### 3.1 Today (home / inbox)
- Header: today's real date ✅, search toggle ✅, **Add lead** ✅ (desktop/tablet; phones use the top-bar **+**).
- **Up next card** ✅: the next visit on the calendar. The demo starts with Ananya's visit ("Today · 11:30 AM · The Courtyard House") 🎭. Every visit booked in the demo is added after it (coming Saturday, 11:30 AM), and the card shows "+N more visits booked". With no visits it says "No visits booked". **Directions** shows a toast ("Directions to … sent to your phone") 🎭. **Message** opens that lead's chat ✅.
- **Follow-up rate 82%** 🧱 (with three lead avatars). **Active value** ✅ = sum of lead budget midpoints (seed data: ₹8.8 Cr), with the open-lead count.
- **Lead inbox** ✅: filter *All / Hot / Warm / New*, plus search by name, requirement or locality. Subtitle counts conversations awaiting a reply. Each row: avatar (green dot if online), name, time, requirement · budget, last message, unread count, intent tag, "via <source>". Tapping a row opens the chat and **marks it read** ✅. Empty state when nothing matches.
- **Due today** ✅: up to 4 remaining follow-ups (time, title, lead). Tapping one, or **Open follow-ups**, goes to Follow-ups.
- Desktop: inbox and Due today side by side. Tablet/phone: stacked.

### 3.2 Lead conversation (WhatsApp chat + lead panel)
**Chat column**
- Header: **Back** returns to the screen the chat was opened from (Today, Pipeline, Follow-ups or Calls) ✅, avatar, status line, **Details** (phones only, opens the lead panel as a bottom sheet ✅), **Call** opens the call screen ✅. Status line 🎭 comes from lead data: "Online on WhatsApp", "Last seen <time> ago", or "New lead · <phone>" for leads added in the demo.
- **Brief strip:** requirement · budget · move-in timing (per lead).
- **Phone-only action buttons:**
  - **Shortlist** ✅ posts a "Sharing 3 homes…" message into the chat and shows a toast.
  - **Plan visit** ✅ books the visit (see Schedule visit below) and changes to "Visit booked".
  - **Matches** opens Properties.
- Messages 🎭: the lead's own opening enquiry, a scripted reply with the lead's budget, the matched property card, and the lead's latest message. Leads added in the demo start with an empty chat and a "Lead captured just now" note.
- Quick replies ✅ fill the composer: "Suggest a time", "Share location" (or "Send a welcome message" for added leads). The **+** menu offers *Property* (fills the matched property's details) and *Location*.
- Sending ✅ adds the message to the thread. Sent messages are **saved per lead** and survive switching leads and refreshing.
- The thread scrolls to the newest message.

**Lead panel** (side panel on desktop/tablet; bottom sheet from **Details** on phones)
- Stage name, budget, requirement, intent tag.
- **Stage track** ✅ shows the lead's real stage: New / Qualified / Visit / Offer.
- **Buyer brief** (per lead): locality, move-in, must-have, phone, and "via <source>".
- **Top property match** ✅: the first listing in the lead's locality, otherwise the first with the same BHK, otherwise the first listing. Budget is not used yet.
- **Share shortlist** ✅ posts the shortlist message into the chat and shows a toast.
- **Schedule visit** ✅ books the coming Saturday at 11:30 AM (no picker) and moves the lead to *Visit planned*. A lead already in *Negotiation* stays there.
- **See all property matches** opens Properties.

### 3.3 Pipeline
- Stages: **New lead → Qualified → Visit planned → Negotiation**.
- Summary: Open deals ✅, Visits planned ✅ (leads in *Visit planned*; the "Next 7 days" caption is 🧱), Likely commission ✅ = sum of budget × 2% fee × stage close probability (10% / 30% / 60% / 80%). Seed data gives ₹9.8 L.
- **Hot leads only** filter toggle ✅.
- Deal card: person (tap → chat), requirement, budget, last WhatsApp message, intent tag, and **Move to <next stage>** ✅ (advances one stage, toast confirms). Stages are saved locally.
- Desktop: 4 columns. Tablet: 2 × 2 grid. Phone: **stage tabs** with counts, one stage's cards at a time.
- Not available yet: moving back, Won/Lost stages, drag-and-drop.

### 3.4 Properties ("Homes")
- 3 Bengaluru listings with photo, "For sale" tag, locality, name, BHK, sq ft and price.
- Locality filter chips ✅ (always visible): All / Indiranagar / Whitefield / HSR Layout.
- **Save** bookmark toggle ✅ (saved locally). **Share** shows a toast only 🎭.
- Not linked to a specific lead, and there's no budget or BHK filter.

### 3.5 Follow-ups ("Tasks")
- Header shows today's date ✅ and a progress ring (done/total) ✅.
- 4 seeded tasks for today, each with a time, lead avatar, title, note and action type.
- Tick to complete ✅ (saved; done tasks are struck through and faded).
- Task action: **Call** opens the call screen ✅. **WhatsApp / Send details** opens the chat ✅. Tapping the title also opens the chat.
- **Add reminder** ✅ adds one fixed task ("Send post-visit follow-up · 6:30 PM"), once only.
- "This week" panel: bar chart 🧱 with today's weekday highlighted ✅, the 82% figure 🧱 and "12% ahead of last week" 🧱. Shown below the list on tablet/phone.
- Empty state when everything is done ✅.

### 3.6 Calls & recordings
- Stats: calls this week 18 🧱, answer rate 72% 🧱, recorded count ✅.
- Recording list: play/pause toggle (visual only 🎭, moving playhead), waveform, duration, note. Search by buyer ✅. Tapping a person opens the chat.
- **New call** opens the lead picker ✅ (search by name, area or budget; a bottom sheet on phones) and then the call screen.
- **Call screen** 🎭: "Calling…" (button reads **Cancel**; Escape also cancels while dialling, but never during or after a call) → connected after 1.2 s, live timer ✅, REC badge, Mute / Speaker / Record toggles. **End call** shows the duration and recording status, then **Save recording** adds it to the top of the list ("Just now") and shows a toast ✅ (saved locally). If recording was turned off, **Done** closes without saving. Full screen on phones.
- Copy: "Secure internet call", "Your personal number stays private", and a consent reminder about recording.

### 3.7 Add lead (quick capture)
- Opens from **+** (phone top bar) or **Add lead** (Today on desktop/tablet).
- Fields: Full name\*, WhatsApp number\* (+91, exactly 10 digits), Looking for (2 BHK / 3 BHK / 4 BHK / Villa / Plot), Preferred area (defaults to "Bengaluru").
- Saving creates a lead at the top of the inbox ✅: source "Quick capture", intent New, stage New lead, budget "Budget to qualify" (counts as ₹0 in totals), 1 unread, phone stored. It appears in the inbox, pipeline and call picker (saved locally). Success screen, then **Done**.

---

## 4. Seed data (`src/data/demo.ts`)
- **Leads (4):**

  | Lead | Requirement | Budget | Intent | Source | Stage | Online |
  |---|---|---|---|---|---|---|
  | Ananya Rao | 3 BHK in Indiranagar | ₹2.4–2.8 Cr | Hot | 99acres | Visit planned | Yes |
  | Rohan & Meera | Villa near Whitefield | ₹3.5 Cr | Warm | Referral | Negotiation | Yes |
  | Vikram Shah | Investment flat, HSR Layout | ₹1.2–1.5 Cr | Warm | MagicBricks | Qualified | No |
  | Sana Fathima | 2 BHK in HSR Layout | ₹1.4 Cr | New | WhatsApp | New lead | No |

  Each lead also has a phone number, move-in timing, must-haves, opening enquiry and latest message.
- **Properties (3):** The Courtyard House (Indiranagar, 3 BHK, ₹2.65 Cr) · Windermere Residences (Whitefield, 4 BHK, ₹3.40 Cr) · Lakeview Terraces (HSR Layout, 2 BHK, ₹1.48 Cr). Photos load from Unsplash, so the demo needs internet.
- **Tasks (4)** and **recordings (3)** linked to the leads above, plus the one optional "Add reminder" task.
- **Fixed demo numbers** (`DEMO_METRICS`): follow-up rate 82% (+12%), weekly chart values, 18 calls this week (2h 14m), 72% answer rate (+8%).

## 5. Saved in the browser (localStorage)
All keys use the prefix `daira:v2:`: `added-leads`, `stages`, `visits`, `read-leads`, `sent-messages`, `tasks`, `completed-tasks`, `recordings`, `saved-properties`.
**Reset demo data** (account menu → confirm) deletes these, plus any old `daira-*` keys, and reloads the page. Run it before every client demo.

## 6. Code map
See `AGENTS.md` for conventions. Each component has a matching `.css` file next to it.
- `src/App.tsx`: shell; owns the current view, the open lead, dialogs and toasts.
- `src/data/demo.ts`: types, seed data, stages, commission settings, property matching.
- `src/state/useDemoStore.ts`: all saved state, derived numbers and actions.
- `src/lib/`: `storage.ts` (localStorage), `format.ts` (dates, money, durations), `useEscapeKey.ts`.
- `src/components/`: `AppNavigation` (sidebar, phone top bar, tab bar), `navigation.ts`, `Dialog` (the one modal / sheet / full-screen shell), `AccountMenu`, `Avatar`, `HeatBadge`, `LeadActions`, `LeadRow`, `PropertyCard`, `Toast`, `Icon`.
- `src/views/`: `TodayView`, `ChatView` (chat + lead panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`.
- `src/modals/`: `AddLeadModal`, `CallPicker`, `CallModal`.
- `src/index.css`: the only place raw colours are defined. Design tokens (colour, 4px spacing scale, radius, shadow, `--fs-*` type sizes, `--tap`) and shared classes (`.btn`, `.card`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge`, `.is-done` and more).

---

## 7. Known issues
- Navigation labels differ between phone and desktop (Today/Inbox, Properties/Homes, Follow-ups/Tasks).
- "Matches" / "See all property matches" open the unfiltered Properties page; there's no way back to the chat, and **Share** on a listing doesn't say who it goes to. Matching also ignores budget.
- Due today items open the Follow-ups page, not the lead's chat.
- On phones the toast can cover the chat composer for 2.6 s.
- The phone pipeline always opens on the "New lead" tab, even when it's empty.
- On desktop, Add lead is only on Today.
- Sent messages show "Now" forever; lead times ("2m", "18m") and message timestamps are fixed text.
- The "Visits planned · Next 7 days" caption is not computed.
- Photos need an internet connection.

## 8. Backlog (not built)
Ordered by demo impact. Move items into §3 when they ship.
1. **Demo mode:** a "Trigger new lead" button that simulates a 99acres lead → automatic WhatsApp reply in seconds → qualification chat that fills the lead card live.
2. **Shared/duplicate lead badge:** "Also sent to ~6 brokers · call now", and merging leads with the same phone number.
3. **Rule-based matching:** match BHK / locality / budget with reasons, select several homes, preview the WhatsApp message, share, then "Viewed by …".
4. **Leads going cold** on Today (no contact in more than 3 days).
5. Lead source capture (portals, Facebook ads) and a sources view.
6. Offline/sync indicator, WhatsApp template and consent (DPDP) screens, OTP signup and onboarding, plan/pricing screen.
7. Pipeline: Won/Lost stages, move back, drag-and-drop on desktop.

---

## 9. Changelog
Newest first. One line per change: date, what changed, which section was updated.
- **2026-10-20:** Design-system pass: all colours, spacing, radius, shadows and font sizes now come from tokens in `src/index.css` (161 scattered colours → one named set); text colours darkened to pass WCAG AA; shared `Dialog`, `HeatBadge`, `LeadActions`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge` replace duplicates. UX fixes: lead details sheet on phones, Back returns to the originating screen, reset asks for confirmation, "Up next" follows booked visits, dialog focus handling, no sticky hover on touch. Updated §2, §3.1, §3.2, §3.6, §5, §6, §7.
- **2026-10-20:** Spec rewritten to match commit `eb13612` (UI polish and module split): readable type scale, phone pipeline tabs, per-lead chat details, live numbers, saved messages, reset demo data, new code map. All sections updated.
- **2026-10-20:** Spec created from the Figma Make export (commit `0e43a34`).
