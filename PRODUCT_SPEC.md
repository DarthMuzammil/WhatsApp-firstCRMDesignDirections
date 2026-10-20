# Daira: Product Spec (living document)

> **What this is:** the single source of truth for what the prototype does *right now* (§2–§7) and for the approved plan (§8). §8 is a plan, not a description of the app: when a planned item ships, move it into §2–§7 and mark it built.
> **Who updates it:** whoever changes the app (person or AI) updates this file in the same commit as any feature, workflow, data or UI change (see `AGENTS.md`). If the code and this doc disagree, that's a bug in one of them.
>
> **Status labels:** ✅ Works (interactive, state changes) · 🎭 Simulated (looks real, but scripted or fixed) · 🧱 Static (hard-coded display only)

---

## 1. Product in one paragraph
Daira is a WhatsApp-first CRM for **real estate brokerages of 20–25 people** in India, starting with Bengaluru: an owner, team managers, field agents and (in some companies) separate telecallers. Agents work from their phones: leads arrive, conversations happen on WhatsApp, matching homes get shared, visits are planned and verified, and follow-ups are kept. Managers and owners see the team: who is handling which lead, who turned up, who is performing. All of it happens in one place instead of across WhatsApp, Excel and a paper diary. This repo is a **UI-only prototype** for customer demos. There is no backend; data is seeded in code, changes are saved in the browser's localStorage, and anything a backend would do (portal sync, WhatsApp delivery, calling, GPS, AI) is **simulated with scripted data**.

**Persona in the prototype today:** Arjun Khanna, broker, Indiranagar (single-user view). §8 M1 adds the team, roles and a "View as" role switcher.

> **Positioning note:** the research PRD targeted solo brokers and 2–5 person shops. At 20–25 seats Daira competes directly with Leadrat and LeadSquared, so per-seat pricing needs revisiting. The edge remains: phone-first for agents in the field, WhatsApp-native, verified visits, and leave-aware lead handover.

**Differentiators the product must make obvious** (from the research PRD):
1. Speed to lead: instant WhatsApp reply and qualification for portal leads.
2. Shared or stale lead awareness: portals sell one lead to many brokers.
3. Rule-based property matching, shared on WhatsApp in one tap.
4. A "Today" view of the broker's day: visits, follow-ups, cold leads.
5. Mobile-first and offline-tolerant, with simple INR pricing.

> Differentiators 1, 2 and 5 are **not in the UI yet**, and 3 and 4 are partial. See §8 (Planned modules).

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

## 8. Planned modules (approved, not built)
Everything here is **UI only**: each item is a screen or flow driven by seed data and scripted events. Each module notes what it simulates. When a module ships, move it into §2–§7 and add a changelog line.

### 8.0 Ground rules
- **Simulate, don't integrate.** Portal leads, WhatsApp delivery, AI output, call bridging and GPS readings are scripted. Screens must look real but never claim a live integration exists.
- **Location in a web app: what we can and can't promise** (write the UI and sales copy within these limits):
  - Location is read **once, at the moment the user taps** "Left office", "Check in" or "Check out". There is **no background tracking, no live map and no route history**; a web page cannot track a phone that isn't showing it.
  - The browser asks for permission once. Phone accuracy is typically 10–50 m; laptops are unreliable, so **check-ins are phone-only**.
  - **Check-in rule:** refused if the agent is more than **200 m** (owner can change this) from the client/property address or office. Message: "You're 1.4 km from The Courtyard House. Move closer to check in."
  - Fake-GPS apps can't be fully blocked. Copy says **"verified location"**, never "proof".
  - **Demo:** a hidden "Pretend location" control (At office / Near client / Far away) shows both approved and refused paths.
- **Phone masking everywhere:** agents never see a buyer's or property owner's full number (`+91 98XXX XX018`). Calls go through the app (§8.15), and WhatsApp goes through the shared business number in the app.

### 8.1 M1 · Team, roles and permissions (foundation)
- **Roles are permission bundles, and one person can hold several:**
  - **Owner:** everything, including settings, billing, audit log and exports.
  - **Manager:** their team's leads, people, attendance, leave approvals and reports; reassigns leads; sees full phone numbers.
  - **Sales (field agent):** only their own leads, visits and tasks; masked numbers.
  - **Pre-sales (telecaller):** the qualification queue; hands qualified leads to Sales; masked numbers.
- **Company setting "Separate pre-sales team":**
  - **On:** new leads go to Pre-sales first, then to Sales.
  - **Off:** Sales and Pre-sales are the same people, and the hand-off step is hidden.
- **Permissions matrix** screen (Owner): view / edit / reassign / export / delete / see full numbers, per role.
- **Team** screen: name, roles, team, status (Active / On leave / Deactivated), invite, deactivate. Deactivating someone forces reassignment of their leads first.
- **Demo "View as"** switcher in the account menu: Owner / Manager / Sales / Pre-sales. Nav, data visibility and number masking change to match.
- **Seed data:** about 22 people. Owner Arjun Khanna; 3 managers (Indiranagar, Whitefield, HSR teams); about 15 Sales; 3 Pre-sales.

### 8.2 M2 · Lead assignment and routing
- **Owner** on every lead; **Reassign** with a reason; history on the lead timeline ("Reassigned from Rahul to Priya by Neha · Leave cover").
- **Routing rules** screen (simulated): round-robin, by locality, by source, Pre-sales first.
- **Response-time alert:** untouched for more than 15 min → red "Overdue" badge, and the lead appears in the manager's **Escalations** list.
- **Unassigned queue** for managers.

### 8.3 M3 · Lead arrival
- **Lead sources** screen: 99acres, MagicBricks, Housing, Facebook ads, WhatsApp, Walk-in, Referral. Each shows "Connected" status 🎭, leads this week, average response time and **cost per lead** (entered manually).
- **Incoming-lead banner** that drops a new lead into the inbox and assigns it according to routing (🎭).
- **Source filter** in the inbox.

### 8.4 M4 · Chat and auto-reply
- An **"Automatic"** tag on the auto-reply sent seconds after the enquiry.
- **Template picker** sheet ("Welcome", "Share shortlist", "Visit reminder", "Follow-up") with fill-in fields.
- **Qualification flow:** questions and answers in the thread; the buyer brief fills in beside it as answers arrive.
- **Auto-reply settings** (Owner/Manager): on/off, message, delay, working hours.
- **24-hour window** hint: "Outside 24h · use a template".

### 8.5 M5 · Lead record
- **Editable profile** with structured fields: BHK, budget min–max, localities, property type, move-in date, purpose (live-in / investment).
- **Notes** and **tags**.
- **One activity timeline:** enquiry → auto-reply → assignment → calls → visits (with check-in status) → stage changes → reassignments.
- **Duplicate alert** when adding an existing phone number: "Already in your inbox as Ananya Rao (owner: Priya) · Open / Merge".
- **Shared-lead badge:** "Also sent to ~6 brokers · call now" (🎭).

### 8.6 M6 · Visits and field check-ins
- **Schedule visit:** date/time picker, property, agent (defaults to the lead owner), and a **visit card** posted in the chat (🎭 sent).
- **Agent's visit flow (phone).** Each step takes one location reading, under the §8.0 limits:
  1. **Left office:** recorded with time and place.
  2. **Check in:** allowed only within 200 m of the visit address; otherwise refused with the distance.
  3. **Check out:** then a required **visit outcome**: liked / not interested / wants another visit, feedback, next step.
- **Manager visit log:** each visit is Planned / Left office / ✅ Verified check-in / ⚠️ Check-in refused (with distance and attempts) / No-show, with timestamps.
- **Visit reminder** preview for the buyer (🎭).

### 8.7 M7 · Attendance
- **Office check-in/out:** allowed only within 200 m of a registered office.
- **Field day:** an agent who starts the day in the field taps "Start field day". They count as present from their first verified client check-in.
- **Attendance register** (Manager/Owner): day and month grid with Present / Late / Field / Absent / On leave, and late marks counted against a grace period.
- **Correction request** ("Forgot to check in") → manager approves or rejects; the history is kept.
- **Settings:** offices with address and radius, working hours, grace period.

### 8.8 M8 · Leave management
- **Apply:** type (casual / sick / earned), dates, reason → shown to the manager.
- **Approve with cover:** before approving, the manager picks a **cover agent**. For the leave dates, the absent agent's leads, visits and tasks move to the cover (with a timeline note), and **return automatically** afterwards.
- **Team calendar** showing leave, holidays and visits; **leave balances**; company **holiday list**.
- Out of scope: payroll, salary, statutory HR.

### 8.9 M9 · Performance and reports
- **Leaderboard** (Manager/Owner; Sales sees their own rank only):
  - deals closed, commission earned
  - verified visits
  - median first-response time
  - follow-ups done on time
  - lead → visit and visit → deal conversion

  Filter by month or team.
- **Agent scorecard:** monthly targets vs. actual (targets set by the manager), personal funnel, attendance and check-in record, trend vs. last month.
- **Owner insights:**
  - funnel and **cost per deal** by source
  - response-time distribution
  - lead ageing (more than 7 days in one stage)
  - lost-deal reasons
  - most shared and most visited properties
  - team-vs-team comparison
  - weighted pipeline forecast
- **Manager daily summary** card: "3 overdue leads · 2 not checked in · 5 visits today · 1 leave request".

### 8.10 M10 · Deal closing
- **Won/Lost** stages (lost needs a reason); **move back** a stage; desktop drag-and-drop.
- **Offer tracker:** asked / offered / agreed price, token amount, date.
- **Document checklist:** KYC, token receipt, agreement.
- **Commission split** between people (e.g. Pre-sales 10% / Sales 90%), feeding the leaderboard.

### 8.11 M11 · Inventory
- **Add/edit property**, availability (Available / On hold / Sold), listing agent, **owner contact** (masked from Sales).
- **Matches for this lead** with reasons ("In budget · 3 BHK · Indiranagar"); pick several → **WhatsApp preview** → sent (🎭) → "Viewed" (🎭).

### 8.12 M12 · Notifications and audit
- **Notifications centre:** lead assigned, overdue, check-in refused, leave request or decision, reassignment.
- **Audit log** (Owner): exports, reassignments, full-number views, permission changes, deactivations.

### 8.13 M13 · AI assist (targeted, every output reviewed by a human)
- **Qualification extraction:** fills the buyer brief from the WhatsApp conversation. Fields are marked "Suggested" until confirmed.
- **Reply drafts** in English, Hindi or Kannada (including mixed); the agent edits and sends, and **nothing is sent automatically**.
- **Call summary:** after a recorded call, shows a summary, next step and suggested brief updates.
- **Lead score with reasons:** "Hot: budget confirmed, visit requested, replied in 2 min".
- **Manager weekly digest:** a plain-language summary of the reports ("Whitefield team response time slipped 40%; 6 leads stuck in Qualified").
- **Not planned:** a "chat with your CRM" assistant, AI auto-sending, AI-written listing descriptions.
- All AI output is 🎭 (fixed demo text) in the prototype.

### 8.14 Navigation by role
- **Sales (phone first):** Today · Leads · Visits · Properties · More (calls, attendance, leave, my performance).
- **Pre-sales:** Queue · Leads · Calls · More.
- **Manager:** adds Team, Attendance & leave, Reports, Escalations.
- **Owner:** adds Settings (roles, offices, sources, templates, routing, auto-reply) and the Audit log.
- The desktop sidebar groups items under **Work** and **Manage**.

### 8.15 Backend notes for later (not part of the UI build)
- **Masked calling (India).** Click-to-call through a cloud-telephony provider such as Exotel, Knowlarity, MyOperator or Ozonetel. The provider rings the agent's phone, then connects the buyer, who sees the company's virtual number. The agent never sees the buyer's number.
  - **KYC** needs a registered business (company PAN, GST / MSME / incorporation certificate, address proof, authorised signatory); some providers accept proprietorships with Udyam/shop licence.
  - **Activation** is typically 1–3 business days after KYC (Exotel asks customers to escalate after 24 working hours).
  - In-browser (VoIP) calling needs extra paperwork and per-city KYC, so start with the phone bridge.
  - Promotional cold calls must use the 140 series; recording needs disclosure under the DPDP Act. Confirm with the provider and a lawyer.
  - **Decision for later:** Daira holds one telephony account for all customers (Daira does their KYC) or each brokerage connects its own account (simpler to start).
- **WhatsApp:** WhatsApp Business API through a provider; Meta business verification; templates must be approved before use.
- **AI:** transcription and LLM costs are per call or message; buyer data falls under the DPDP Act.

### 8.16 Build order (UI)
1. M1 + M2: roles, team, "View as", owner and reassignment.
2. M5 + M3: lead record, lead arrival.
3. M6 + M7 + M8: visits with check-in, attendance, leave with cover.
4. M9: reports and leaderboard (needs the realistic team data from steps 1–3).
5. M4, M13: chat automation and AI assist.
6. M10, M11, M12: closing, inventory, notifications and audit.
7. **Demo mode:** a scripted run across all of the above (new 99acres lead → auto-reply → AI-filled brief → assigned → visit with verified check-in → won → leaderboard moves).

---

## 9. Changelog
Newest first. One line per change: date, what changed, which section was updated.
- **2026-10-20:** Product reframed for brokerages of 20–25 people (§1). Backlog replaced by the approved plan (§8): roles with optional separate pre-sales, phone masking, routing, lead arrival, chat automation, lead record, verified visit check-ins within web-app limits (200 m, no live tracking), attendance, leave with cover agent, performance reports, deal closing, inventory, notifications and audit, targeted AI assist, backend notes on Indian calling providers, and build order.
- **2026-10-20:** Design-system pass: all colours, spacing, radius, shadows and font sizes now come from tokens in `src/index.css` (161 scattered colours → one named set); text colours darkened to pass WCAG AA; shared `Dialog`, `HeatBadge`, `LeadActions`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge` replace duplicates. UX fixes: lead details sheet on phones, Back returns to the originating screen, reset asks for confirmation, "Up next" follows booked visits, dialog focus handling, no sticky hover on touch. Updated §2, §3.1, §3.2, §3.6, §5, §6, §7.
- **2026-10-20:** Spec rewritten to match commit `eb13612` (UI polish and module split): readable type scale, phone pipeline tabs, per-lead chat details, live numbers, saved messages, reset demo data, new code map. All sections updated.
- **2026-10-20:** Spec created from the Figma Make export (commit `0e43a34`).
