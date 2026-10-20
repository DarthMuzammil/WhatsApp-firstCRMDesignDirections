# Daira: Product Spec (living document)

> **What this is:** the single source of truth for what the prototype does *right now* (§2–§7) and for the approved plan (§8). §8 is a plan, not a description of the app: when a planned item ships, move it into §2–§7 and mark it built.
> **Who updates it:** whoever changes the app (person or AI) updates this file in the same commit as any feature, workflow, data or UI change (see `AGENTS.md`). If the code and this doc disagree, that's a bug in one of them.
>
> **Status labels:** ✅ Works (interactive, state changes) · 🎭 Simulated (looks real, but scripted or fixed) · 🧱 Static (hard-coded display only)

---

## 1. Product in one paragraph
Daira is a WhatsApp-first CRM for **real estate brokerages of 20–25 people** in India, starting with Bengaluru: an owner, team managers, field agents and (in some companies) separate telecallers. Agents work from their phones: leads arrive, conversations happen on WhatsApp, matching homes get shared, visits are planned and verified, and follow-ups are kept. Managers and owners see the team: who is handling which lead, who turned up, who is performing. All of it happens in one place instead of across WhatsApp, Excel and a paper diary. This repo is a **UI-only prototype** for customer demos. There is no backend; data is seeded in code, changes are saved in the browser's localStorage, and anything a backend would do (portal sync, WhatsApp delivery, calling, GPS, AI) is **simulated with scripted data**.

**People in the prototype:** a 22-person brokerage (owner Arjun Khanna, 3 team managers, 15 Sales, 3 Pre-sales). The demo **"View as"** switcher (account menu) shows the app as the Owner, a Manager, a Sales agent or a Pre-sales telecaller; data visibility, phone masking and navigation change with the role (§3.8).

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
| Brand + status | Sidebar with Daira logo (tap → Today) | Top bar: logo, "● WhatsApp connected" 🧱, viewer's avatar (account menu), **+** add lead |
| Main nav | Sidebar **Work** group: **Today** (unread badge), **Visits**, **Pipeline**, **Properties**, **Follow-ups** (tasks-left badge), **Calls**, **Attendance**. **Manage** group, by permission: **Escalations** (red count; Manager/Owner), **Lead sources** (Manager/Owner), **Team** (Manager/Owner), **Settings** (Owner) | Bottom tabs: **Inbox** (unread badge), **Visits**, **Pipeline**, **Tasks**, **More**. **More** opens a sheet with Properties, Calls, Attendance, plus the Manage screens the viewer may use (a red "!" on More when escalations are waiting) |
| Progress card | "Today's progress" ✅: buyers awaiting a reply · follow-ups left, with a progress bar of completed tasks. Says "You're all caught up" only when both are zero. | — |
| User card | Viewer's name and role ("Sales · Indiranagar") | — |
| Account menu | "⋯" next to the user card (opens upwards, beside the sidebar) | Viewer's avatar |
| Account menu contents | **Demo · View as** ✅: Arjun Khanna (Owner), Neha Kapoor (Manager · Indiranagar), Priya Nair (Sales · Indiranagar), Kiran Patel (Pre-sales). Then **Simulate incoming lead** ✅ (§3.11) and **Reset demo data** ✅ (asks to confirm first) | same |

⚠️ Names differ between desktop and phone (Today/Inbox, Follow-ups/Tasks). Pick one set.

While a chat is open, the nav keeps the screen it was opened from highlighted. If switching "View as" hides the open lead or screen, the app falls back to that screen or to Today.

Toasts confirm actions at the bottom of the screen for 2.6 s. Dialogs close with **Escape** or by tapping outside, keep keyboard focus inside while open, and return focus to the button that opened them. On phones, pickers and lead details open as bottom sheets.

---

## 3. Screens & workflows

### 3.1 Today (home / inbox)
- Header: today's real date ✅; title "Your day, at a glance" (Sales/Pre-sales) or "Your team today" (Manager/Owner); search toggle ✅; **Add lead** ✅ (desktop/tablet; phones use the top-bar **+**).
- Every number and list on this screen covers only the leads the viewer may see (§3.8).
- **Check-in reminder** ✅ for anyone who tracks attendance and hasn't checked in today: "You haven't checked in today · Work starts 9:30 AM" with **Check in** (opens Attendance).
- **Up next card** ✅: the soonest open visit (planned, on the way or checked in) among the viewer's visits (§3.12), with "+N more visits booked". With none it says "No visits booked". **Directions** shows a toast ("Directions to … sent to your phone") 🎭. **Message** opens that lead's chat ✅.
- **Follow-up rate 82%** 🧱 (with three lead avatars). **Active value** ✅ = sum of budget midpoints of the leads the viewer sees (Owner with seed data: ₹27.4 Cr), with the open-lead count.
- **Lead inbox** ✅: filter *All / Hot / Warm / New*, a **source** dropdown (All sources + every source in the viewer's leads), plus search by name, requirement or locality. Subtitle counts conversations awaiting a reply. Each row: avatar (green dot if online), name, time since the last message, requirement · budget, last message, unread count, intent tag, red **Overdue** flag (unread for more than 15 min), red-outlined **Shared ×N** flag (portal lead also sent to ~N other brokers), and "via <source>". Managers and the Owner also see the **owner** ("Priya N.") or a yellow **Unassigned** flag. Tapping a row opens the chat and **marks it read** ✅. Empty state when nothing matches.
- **Due today** ✅: up to 4 remaining follow-ups (time, title, lead). Tapping one, or **Open follow-ups**, goes to Follow-ups.
- Desktop: inbox and Due today side by side. Tablet/phone: stacked.

### 3.2 Lead conversation (WhatsApp chat + lead panel)
**Chat column**
- Header: **Back** returns to the screen the chat was opened from (Today, Pipeline, Follow-ups or Calls) ✅, avatar, status line, **Details** (phones only, opens the lead panel as a bottom sheet ✅), **Call** opens the call screen ✅. Status line 🎭 comes from lead data: "Online on WhatsApp", "Last seen <time> ago", or "New lead · <phone>" for leads added in the demo.
- **Brief strip:** requirement · budget · move-in timing (per lead).
- **Phone-only action buttons:**
  - **Shortlist** ✅ posts a "Sharing 3 homes…" message into the chat and shows a toast.
  - **Plan visit** ✅ opens Schedule visit (below); once booked it reads "Visit booked" and opens Visits.
  - **Matches** opens Properties.
- Messages 🎭: the lead's own opening enquiry, a scripted reply with the lead's budget, the matched property card, and the lead's latest message. Leads added in the demo start with an empty chat and a "Lead captured just now" note. Leads that **arrived from a source in the demo** show only the buyer's enquiry ("Just now").
- Quick replies ✅ fill the composer: "Suggest a time", "Share location" (or "Send a welcome message" for added and newly arrived leads). The **+** menu offers *Property* (fills the matched property's details) and *Location*.
- Sending ✅ adds the message to the thread. Sent messages are **saved per lead** and survive switching leads and refreshing.
- The thread scrolls to the newest message.

**Lead panel** (side panel on desktop/tablet; bottom sheet from **Details** on phones), in three tabs: **Overview · Timeline · Notes** (counts in the labels).

*Overview tab*
- **Lead owner card** ✅: owner's name and role (or "Unassigned").
  - Manager/Owner: **Reassign** (or **Assign**) opens a people picker with open-lead counts and a reason (Workload balance / Locality expertise / Leave cover / Buyer request / Other).
  - Pre-sales, when the lead is theirs and *Separate pre-sales team* is on: **Hand to Sales** (picker of Sales people). The lead then leaves their view and the chat closes.
  - Sales: no reassign button.
- **Ownership history** ✅ under the card: each change with new owner, reason, previous owner, who did it and when.
- Stage name, budget, requirement, intent tag.
- **Shared-lead warning** 🎭 (portal leads only): "Also sent to ~6 brokers by 99acres. Call now to be first."
- **Stage track** ✅ shows the lead's real stage: New / Qualified / Visit / Offer.
- **Buyer brief** (per lead): purpose (Live-in / Investment), localities, move-in, must-have, phone, source. **Edit** ✅ opens a form with structured fields: Looking for (2/3/4 BHK, Villa, Plot), Purpose, budget from/up to in ₹ Cr (must be max ≥ min, otherwise Save is disabled with an error), localities (comma separated; the first is the main one), Move-in, Must-haves. Saving rebuilds the requirement and budget text everywhere (inbox, pipeline, totals) and adds a timeline entry. On phones, Edit closes the sheet and opens the form. **Phone numbers are masked** (`+91 98XXX XX018`) for Sales and Pre-sales; Managers and the Owner see full numbers.
- **Tags** ✅: applied tags as removable chips; **+ Tag** shows suggestions (First-time buyer, Loan needed, NRI, Investor, Urgent, Price sensitive, Repeat client) and a custom-tag field (Enter to add).
- **Top property match** ✅: the first listing in the lead's locality, otherwise the first with the same BHK, otherwise the first listing. Budget is not used yet.
- **Share shortlist** ✅ posts the shortlist message into the chat and shows a toast.
- **Schedule visit** ✅ opens a dialog: property (matched one preselected), day (Today … 6 days ahead; defaults to the coming Saturday), time slot, and agent (the lead owner; only Managers/Owner can change it). Booking posts a WhatsApp confirmation in the chat ("Visit confirmed: The Courtyard House, Indiranagar, Tomorrow at 3:00 PM…") 🎭, moves the lead to *Visit planned* (never backwards), and logs it. When a visit is booked the button reads "Visit booked · Tomorrow · 3:00 PM" and opens Visits.
- **See all property matches** opens Properties.

*Timeline tab* ✅: everything on the lead, newest first. Demo actions are logged as they happen (with who did it): messages sent, assignments, stage moves, visits booked, calls saved, notes, tag changes, brief edits, merged enquiries. Below them, events implied by the seed data: the buyer's latest message, seeded call recordings, the seeded visit, "Assigned to … by routing", and "First enquiry via <source>" last.

*Notes tab* ✅: private team notes (not sent to the buyer). Add with the text box; each note shows author and time.

### 3.3 Pipeline
- Stages: **New lead → Qualified → Visit planned → Negotiation**.
- Summary: Open deals ✅, Visits planned ✅ (leads in *Visit planned*; the "Next 7 days" caption is 🧱), Likely commission ✅ = sum of budget × 2% fee × stage close probability (10% / 30% / 60% / 80%), over the leads the viewer sees.
- **Hot leads only** filter toggle ✅.
- Deal card: person (tap → chat), requirement (Managers/Owner also see the owner or "Unassigned"), budget, last WhatsApp message, intent tag, and **Move to <next stage>** ✅ (advances one stage, toast confirms). Stages are saved locally.
- Desktop: 4 columns. Tablet: 2 × 2 grid. Phone: **stage tabs** with counts, one stage's cards at a time.
- Not available yet: moving back, Won/Lost stages, drag-and-drop.

### 3.4 Properties ("Homes")
- 3 Bengaluru listings with photo, "For sale" tag, locality, name, BHK, sq ft and price.
- Locality filter chips ✅ (always visible): All / Indiranagar / Whitefield / HSR Layout.
- **Save** bookmark toggle ✅ (saved locally). **Share** shows a toast only 🎭.
- Not linked to a specific lead, and there's no budget or BHK filter.

### 3.5 Follow-ups ("Tasks")
- Header shows today's date ✅ and a progress ring (done/total) ✅.
- Today's seeded tasks for the leads the viewer sees (8 in total; e.g. 2 for Priya Nair), each with a time, lead avatar, title, note and action type.
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
- **Duplicate check** ✅: once 10 digits are typed, the number is looked up across **all** leads in the company. If found, a yellow alert names the existing lead (requirement, budget, owner; "(another team)" if the viewer can't see it) with **Open lead** (only if visible) and **Merge enquiry** (adds the new enquiry as a note and timeline entry on the existing lead; no new lead; success screen "Enquiry merged"). The submit button becomes "Add as a separate lead anyway".
- Fields: Full name\*, WhatsApp number\* (+91, exactly 10 digits), Looking for (2 BHK / 3 BHK / 4 BHK / Villa / Plot), Preferred area (defaults to "Bengaluru"). Managers and the Owner also get **Assign to**: *Auto* (company routing, §3.10) or a named person with their open-lead count.
- **Who owns the new lead:** Sales and Pre-sales own what they add. For Managers/Owner, *Auto* routes it: to the Pre-sales person with fewest open leads when *Separate pre-sales team* is on; otherwise to Sales, by locality team (if routing is "By locality" and the area matches a team) or fewest open leads.
- Saving creates a lead at the top of the inbox ✅: source "Quick capture", intent New, stage New lead, budget "Budget to qualify" (counts as ₹0 in totals), 1 unread, phone stored, and an ownership-history entry. Success screen says where it went: "now in your inbox", "assigned to <name>" or "in the unassigned queue".

### 3.8 Team, roles and visibility (M1)
- **Roles** (permission bundles; one person can hold several): **Owner**, **Manager**, **Sales**, **Pre-sales**. Permissions: see all leads · see team's leads · assign/reassign · see full phone numbers · invite/deactivate people · change settings · view reports · export · hand leads to Sales (table in §3.10).
- **Which leads someone sees** ✅: Owner, every lead. Manager, leads owned by their team plus unassigned leads. Sales and Pre-sales, only their own. Tasks, recordings, upcoming visits, badges and every total follow the same rule.
- **Team screen** ✅ (Manager: own team; Owner: everyone):
  - Stat strip: Active / On leave / Deactivated.
  - Cards per area team (Indiranagar, Whitefield, HSR Layout) plus, for the Owner, **Pre-sales** and **Leadership**.
  - Each person: avatar, name (and "(you)"), phone, role chips, status (Active / On leave / Deactivated), open-lead count, and **Deactivate** or **Reactivate** (never for yourself or the Owner).
  - **Deactivate** someone with open leads → picker "who takes them over" → every lead moves (with a history entry "Previous owner deactivated"), then the person is marked Deactivated. With no leads it deactivates directly.
  - **Invite person** 🎭: name, mobile, role (Owner may pick Sales / Pre-sales / Manager; a Manager can only add Sales to their own team), team. The person is added straight away and a toast says the WhatsApp invite was sent.
- "On leave" comes from approved leave covering today (§3.13); Kavya Reddy starts on leave.

### 3.9 Escalations (M2)
- **Manager/Owner screen** with stat strip: overdue replies, unassigned, response target (15 min 🧱).
- **Unassigned leads**: lead, need, budget, source, intent, "Arrived Xm ago", and **Assign** (picker with reasons: New lead / Locality expertise / Workload balance).
- **Overdue replies**: owned leads unread for more than 15 min, with "Waiting Xm", owner, and **Reassign** (reasons: Overdue reply / Workload balance / Leave cover / Other).
- Tapping a lead opens its chat. Assigning updates the nav badge immediately. Seed data starts with **5** escalations (2 unassigned, 3 overdue).
- Overdue is computed from fixed "minutes ago" seed values 🧱, so it does not tick over time; opening a chat marks it read and clears it.

### 3.10 Settings (M1/M2, Owner only)
- **Separate pre-sales team** ✅ on/off (the whole row is the switch). On: new leads route to Pre-sales first and they get **Hand to Sales**. Off: Sales handle leads end to end; hand-off is hidden and Pre-sales are left out of routing and pickers.
- **Lead routing** ✅: Round-robin (fewest open leads) / By locality (team covering the buyer's area) / By source (team chosen per source on Lead sources, §3.11). Within the team, whoever has the fewest open leads.
- **Field check-ins and attendance** ✅: check-in radius 100 / 200 / 300 / 500 m (default 200); working hours (start 9:00 / 9:30 / 10:00 AM, grace 10 / 15 / 30 min; defaults 9:30 and 15); the three offices with addresses.
- **Roles and permissions** table 🧱 (read-only; custom roles later).

### 3.11 Lead sources and arrivals (M3)
- **Lead sources screen** (Manager/Owner; editable by the Owner only):
  - Stat strip: leads this week (all sources), spend this week (leads × cost per lead), blended cost per lead.
  - One row per source: 99acres, MagicBricks, Housing (Portal, "shared with ~N brokers"), Facebook ads (Ads), WhatsApp (Messaging), Walk-in, Referral, Quick capture (Offline, "Manual entry").
  - Each row: status (Connected / Not connected / Manual entry), leads this week 🧱, first-reply time 🧱, **cost per lead** (₹, editable by the Owner, totals update live), **Feeds team** (used by "By source" routing; editable by the Owner), **Disconnect/Connect** 🎭 (online sources, Owner), **Simulate** (online sources while connected).
  - **Simulate new lead** in the header rotates through connected sources.
- **Simulated arrival** ✅ (header button, a row's Simulate, or account menu → *Simulate incoming lead*, available to every role):
  - The next buyer from a pool of 6 (Meera Iyer, Arvind Rao, Sunita Reddy, Karan Malhotra, Fatima Sheikh, Harish Gowda) arrives from that source with 1 unread message, the portal's "shared with ~N" figure, and an owner from the company routing rule (§3.10), recorded in ownership history and the timeline ("New enquiry via 99acres · routed to …").
  - A **New lead banner** slides in (top right on desktop; under the top bar on phones) for 7 s: source, buyer, need, budget, owner or "Waiting in the unassigned queue", shared figure, **Dismiss** and **Reply now** (only if the viewer can see the lead; opens the chat).
  - With no connected source, a toast says to connect one.

### 3.12 Visits and field check-ins (M6)
- **Visits screen** (everyone): "Your visits" (Sales/Pre-sales) or "Team visits" (Manager/Owner, for the leads they can see). Stat strip: visits today (completed count), verified check-ins today, refused attempts today (and yesterday's no-shows). Sections: **Today**, **Upcoming**, **Earlier**.
- **Each visit:** time and day, buyer (tap → chat), property and locality, agent, status (Planned / On the way / Checked in / Completed / No-show), each recorded step (Left office · time, or "Left 1.2 km from Whitefield office"; ✅ Verified check-in · time · distance; ⚠️ Check-in refused · time · distance or accuracy; Checked out), the outcome, and the result of the last tap.
- **Agent flow** (only the visit's agent, only on the day):
  - **Left office** is always recorded, with a note if the reading was more than the radius from the agent's office.
  - **Check in** is allowed straight from Planned or after Left office. It is **refused** when the reading is more than the radius (default 200 m) from the property, or less accurate than 100 m, with a message: "You're 1.4 km from The Courtyard House. Move closer to check in." The refused attempt is kept on the log.
  - **Check out** (only after a verified check-in) opens a **required outcome form** that can't be dismissed: Liked it / Wants another visit / Not interested, buyer feedback, next step.
  - Every step goes on the lead's timeline.
- **Where is this phone? (Demo)** control: At office / Near client (~60 m) / Far away (~1.4 km) give scripted readings 🎭. **This device** uses the browser's real location (asks permission once) ✅. The panel states the limits: read once when you tap, no live tracking, refused beyond the radius.
- **Seed visits:** Ananya (Priya, today 11:30, planned), Deepak (Ritu, today 4:00 PM, planned), Lavanya (Manoj, today 9:30, completed with outcome), Rohan & Meera (Vivek, today 10:00, checked in after one refused attempt), Nisha (Rohit, tomorrow 10:30), Vikram (Sneha, yesterday, no-show).

### 3.13 Attendance & leave (M7, M8)
- **Who:** everyone except the Owner (the Owner sees the register only). Tabs: **My day** and **Leave** (anyone tracked), **Register** and **Requests** (Manager: their team; Owner: everyone).
- **My day:**
  - Demo location control (At office / Far away / This device).
  - Status card: Not checked in yet / In office since 9:12 · on time or marked late / Field day since … ("present once you check in at a client", then "Verified at The Courtyard House, 11:34") / Checked out / On leave. Refused office attempts are counted on the card.
  - **Check in at office** ✅: refused beyond the radius of the person's office (team office; Pre-sales use HQ) or if imprecise, with the distance. **Late** if after work start + grace (device clock).
  - **Start field day** ✅: no location needed; counts as present after the first verified client check-in in Visits.
  - **Check out for the day** ✅: office days must check out within the radius; field days anywhere.
  - Your office card (name, address, work start, grace, radius).
  - **Last 10 working days** (Sundays skipped) with codes; absent or late days offer **Request correction** (reason required) → "Correction pending / approved / rejected".
- **Register:** today's counts (Present, Late, Field day, Not checked in yet, On leave) and a grid of people × last 10 working days + Today. Codes P / L / F / A / LV / –, with "*" for corrected days. The name column stays visible while the grid scrolls on phones.
- **Requests:** leave requests (below), then attendance corrections in scope with **Approve** (day becomes Present*) or **Reject**. The tab label counts pending items of both kinds.
- **Leave tab** ✅: balances for Casual / Sick / Earned (allowance 8 / 6 / 15 minus days used before the demo minus approved; pending shown separately). **Apply for leave:** type, from (today … 30 days ahead), to (up to 14 days on), reason. It is refused with a message when the last day is before the first, it overlaps your own pending/approved leave, or it exceeds the balance left after pending requests. **My requests** lists type, dates, days, reason, cover and status (pending / approved / rejected / back).
- **Leave approvals (Requests tab):**
  - **Approve…** opens a cover picker (teammates in the same area team; Pre-sales pick another Pre-sales person), telling the manager what will move.
  - On approval, the person's **open visits on the leave days move to the cover immediately**. Their **leads move when the leave starts**: immediately if it covers today; for future leave the row says "leads move on <date>" and offers **Start cover now (demo)**, since time doesn't pass in the demo. Each moved lead gets an ownership-history entry "Leave cover (dates)".
  - **Return leads** hands back the leads and visits that were moved and are still with the cover, and ends the leave from today. **Reject** declines.
  - A note explains that the live product does both steps automatically.
- **Team calendar (Register tab):** approved and pending leave in scope (with cover) and fixed-date public holidays in the next 90 days (e.g. Kannada Rajyotsava, Christmas).
- **On leave** status: a person shows "On leave" (Team screen, pickers) and LV in attendance on any day an approved leave covers.

---

## 4. Seed data (`src/data/demo.ts`, `src/data/team.ts`, `src/data/sources.ts`)
- **Team (22, `team.ts`):** Owner Arjun Khanna; Indiranagar team (manager Neha Kapoor; Sales Priya Nair, Aditya Rao, Kavya Reddy *on leave*, Sameer Joshi, Divya Iyer); Whitefield (manager Rahul Menon; Sales Vivek Sharma, Ritu Bansal, Manoj Kumar, Ayesha Khan, Karthik Srinivas); HSR Layout (manager Farah Sheikh; Sales Sneha Pillai, Rohit Verma, Ananth Krishnan, Meghna Das, Tarun Gowda); central Pre-sales Kiran Patel, Lakshmi Narayan, Imran Ali.
- **Leads (12):**

  | Lead | Requirement | Budget | Intent | Source | Stage | Owner | Note |
  |---|---|---|---|---|---|---|---|
  | Ananya Rao | 3 BHK in Indiranagar | ₹2.4–2.8 Cr | Hot | 99acres | Visit planned | Priya Nair | visit today 11:30 |
  | Rohan & Meera | Villa near Whitefield | ₹3.5 Cr | Warm | Referral | Negotiation | Vivek Sharma | overdue |
  | Vikram Shah | Investment flat, HSR Layout | ₹1.2–1.5 Cr | Warm | MagicBricks | Qualified | Sneha Pillai | |
  | Sana Fathima | 2 BHK in HSR Layout | ₹1.4 Cr | New | WhatsApp | New lead | Kiran Patel (Pre-sales) | |
  | Deepak Malhotra | 4 BHK in Whitefield | ₹3–3.4 Cr | Hot | Housing | Visit planned | Ritu Bansal | overdue |
  | Nisha Kulkarni | 3 BHK in HSR Layout | ₹1.8–2 Cr | Warm | Facebook ads | Qualified | Rohit Verma | |
  | Farhan Qureshi | 2 BHK in Indiranagar | ₹1.5–1.7 Cr | New | 99acres | New lead | — | unassigned |
  | Lavanya Subramaniam | Villa in Whitefield | ₹4–4.2 Cr | Hot | Referral | Negotiation | Manoj Kumar | |
  | Gaurav Bhatia | 3 BHK in Indiranagar | ₹2.8–3 Cr | Warm | MagicBricks | Qualified | Aditya Rao | overdue |
  | Pooja Venkatesh | 2 BHK in HSR Layout | ₹1.2–1.3 Cr | New | Walk-in | New lead | Kiran Patel (Pre-sales) | |
  | Sanjay Mehta | Investment flat, Whitefield | ₹1–1.2 Cr | New | WhatsApp | New lead | — | unassigned, overdue |
  | Ishita Banerjee | 3 BHK in Indiranagar | ₹2.4–2.6 Cr | Hot | 99acres | Qualified | Priya Nair | |

  Each lead also has a phone number, minutes since the last message, move-in timing, must-haves, opening enquiry and latest message. Portal leads carry a "shared with ~N brokers" figure 🎭: Ananya 6, Deepak 5, Farhan 4, Gaurav 3, Ishita 6. Vikram and Sanjay are marked Investment. The Owner's totals with this data: active value ₹27.4 Cr across 12 leads.
- **Properties (3):** The Courtyard House (Indiranagar, 3 BHK, ₹2.65 Cr) · Windermere Residences (Whitefield, 4 BHK, ₹3.40 Cr) · Lakeview Terraces (HSR Layout, 2 BHK, ₹1.48 Cr). Photos load from Unsplash, so the demo needs internet.
- **Leave (`leave.ts`):** Kavya (Casual, 3 days ago → tomorrow, approved, cover Sameer); Aditya (Casual, in 2–3 days, pending, 1 lead); Rohit (Sick, tomorrow, pending; he has a visit tomorrow). Allowances 8 / 6 / 15 and generated days already used.
- **Attendance (`attendance.ts`):** generated history for the last 10 working days; today's records (most people checked in, some late or in the field; Priya, Neha, Kiran and Sameer not yet, so the demo can do it); Kavya on leave; one pending correction from Sameer for 3 working days ago.
- **Visits and offices (`visits.ts`):** 6 seed visits (§3.12); offices in Indiranagar (HQ), Whitefield and HSR Layout with coordinates. Properties also carry coordinates.
- **Lead sources (8, `sources.ts`)** with weekly leads, first-reply minutes, default cost per lead (₹450 / 400 / 350 / 180 / 0…) and default team; plus the pool of 6 buyers used for simulated arrivals.
- **Tasks (8)** and **recordings (5)** linked to the leads above, plus the one optional "Add reminder" task (attached to the viewer's first lead).
- **Fixed demo numbers** (`DEMO_METRICS`): follow-up rate 82% (+12%), weekly chart values, 18 calls this week (2h 14m), 72% answer rate (+8%).

## 5. Saved in the browser (localStorage)
All keys use the prefix `daira:v4:`: `viewer`, `settings`, `pretend-location`, `attendance-today`, `corrections`, `leave`, `added-members`, `member-status`, `added-leads`, `owners`, `assignments`, `lead-edits`, `notes`, `tags`, `activity`, `source-settings`, `arrivals`, `stages`, `visits` (visit records with steps and outcomes), `read-leads`, `sent-messages`, `tasks`, `completed-tasks`, `recordings`, `saved-properties`.
**Reset demo data** (account menu → confirm) deletes these, plus any older `daira:*` / `daira-*` keys, and reloads the page. Run it before every client demo.

## 6. Code map
See `AGENTS.md` for conventions. Each component has a matching `.css` file next to it.
- `src/App.tsx`: shell; owns the current view, the open lead, dialogs and toasts, and falls back when "View as" hides a screen.
- `src/data/demo.ts`: lead/property/task types and seed data, stages, response SLA, commission settings, property matching.
- `src/data/team.ts`: people, teams, roles, "View as" personas.
- `src/data/sources.ts`: lead sources and the simulated-arrival buyer pool.
- `src/data/visits.ts`: visit model, seed visits, offices, time slots, check-in limits.
- `src/data/attendance.ts`: attendance codes, seed history and today's records, corrections, working-hours options.
- `src/data/leave.ts`: leave types, allowances, seed requests, holidays, date-range helpers.
- `src/state/useDemoStore.ts`: all saved state, the viewer, visibility filtering, routing, activity log and timeline, duplicate lookup, derived numbers and actions.
- `src/lib/`: `location.ts` (one-off location readings: demo readings, the browser's real location, distance), `permissions.ts` (role → permissions, who sees which lead), `storage.ts` (localStorage), `format.ts` (dates, money, durations, phone masking), `useEscapeKey.ts`.
- `src/components/`: `AppNavigation` (sidebar with Work/Manage groups, phone top bar, tab bar with More sheet), `navigation.ts` (items with required permission), `Dialog` (the one modal / sheet / full-screen shell), `AccountMenu`, `Avatar`, `HeatBadge`, `LeadActions`, `LeadRow`, `LeadTimeline`, `LeadNotes`, `LeadTags`, `IncomingLeadBanner`, `LocationControl` (demo location picker), `PropertyCard`, `Toast`, `Icon`.
- `src/views/`: `TodayView`, `ChatView` (chat + lead panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`, `VisitsView` (with the visit outcome form), `AttendanceView` (My day, Leave, Register with team calendar, Requests), `EscalationsView`, `LeadSourcesView`, `TeamView` (with invite dialog), `SettingsView`.
- `src/modals/`: `AddLeadModal` (with duplicate check), `EditLeadDialog` (structured buyer brief), `ScheduleVisitDialog`, `AssignDialog` (people picker for assign / reassign / hand-off / deactivate), `CallPicker`, `CallModal`.
- `src/index.css`: the only place raw colours are defined. Design tokens (colour, 4px spacing scale, radius, shadow, `--fs-*` type sizes, `--tap`) and shared classes (`.btn`, `.card`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge`, `.is-done` and more).

---

## 7. Known issues
- Navigation labels differ between phone and desktop (Today/Inbox, Properties/Homes, Follow-ups/Tasks).
- "Matches" / "See all property matches" open the unfiltered Properties page; there's no way back to the chat, and **Share** on a listing doesn't say who it goes to. Matching also ignores budget.
- Due today items open the Follow-ups page, not the lead's chat.
- On phones the toast can cover the chat composer for 2.6 s.
- The phone pipeline always opens on the "New lead" tab, even when it's empty.
- On desktop, Add lead is only on Today.
- Sent messages show "Now" forever; lead times ("2m", "18m") and message timestamps are fixed seed values, so "Overdue" never appears or clears on its own.
- The permissions table can't be edited.
- Leave counts calendar days (weekends and holidays included). Leave can't be cancelled by the person once requested.
- Today's attendance doesn't roll over at midnight (the demo always shows one "today"); history before today is generated, not recorded.
- Visit step times use the real clock, but visit days are relative to today, so the demo always looks like "today". Nothing marks a visit as a no-show automatically, and visits can't be rescheduled or cancelled yet.
- Lead-source weekly figures and first-reply times are fixed; connecting a source is a toggle, not a real login. Simulated buyers repeat after 6 arrivals.
- Newly invited people can't log in (there is no login); they only appear in Team and pickers.
- Activity logged in the demo always says "Just now"; seeded timeline entries use fixed labels ("Earlier", "On arrival").
- Editing the brief doesn't change which property is matched beyond the main locality, and tags don't filter the inbox yet.
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

### 8.1 M1 · Team, roles and permissions (foundation) — ✅ built (§3.8, §3.10); permissions table is read-only
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

### 8.2 M2 · Lead assignment and routing — ✅ built (§3.2, §3.7, §3.9, §3.10)
- **Owner** on every lead; **Reassign** with a reason; history on the lead timeline ("Reassigned from Rahul to Priya by Neha · Leave cover").
- **Routing rules** screen (simulated): round-robin, by locality, by source, Pre-sales first.
- **Response-time alert:** untouched for more than 15 min → red "Overdue" badge, and the lead appears in the manager's **Escalations** list.
- **Unassigned queue** for managers.

### 8.3 M3 · Lead arrival — ✅ built (§3.1 source filter, §3.11)
- **Lead sources** screen: 99acres, MagicBricks, Housing, Facebook ads, WhatsApp, Walk-in, Referral. Each shows "Connected" status 🎭, leads this week, average response time and **cost per lead** (entered manually).
- **Incoming-lead banner** that drops a new lead into the inbox and assigns it according to routing (🎭).
- **Source filter** in the inbox.

### 8.4 M4 · Chat and auto-reply
- An **"Automatic"** tag on the auto-reply sent seconds after the enquiry.
- **Template picker** sheet ("Welcome", "Share shortlist", "Visit reminder", "Follow-up") with fill-in fields.
- **Qualification flow:** questions and answers in the thread; the buyer brief fills in beside it as answers arrive.
- **Auto-reply settings** (Owner/Manager): on/off, message, delay, working hours.
- **24-hour window** hint: "Outside 24h · use a template".

### 8.5 M5 · Lead record — ✅ built (§3.2 Overview/Timeline/Notes, §3.7 duplicate check)
- **Editable profile** with structured fields: BHK, budget min–max, localities, property type, move-in date, purpose (live-in / investment).
- **Notes** and **tags**.
- **One activity timeline:** enquiry → auto-reply → assignment → calls → visits (with check-in status) → stage changes → reassignments.
- **Duplicate alert** when adding an existing phone number: "Already in your inbox as Ananya Rao (owner: Priya) · Open / Merge".
- **Shared-lead badge:** "Also sent to ~6 brokers · call now" (🎭).

### 8.6 M6 · Visits and field check-ins — ✅ built (§3.2 Schedule visit, §3.12, §3.10 radius)
- **Schedule visit:** date/time picker, property, agent (defaults to the lead owner), and a **visit card** posted in the chat (🎭 sent).
- **Agent's visit flow (phone).** Each step takes one location reading, under the §8.0 limits:
  1. **Left office:** recorded with time and place.
  2. **Check in:** allowed only within 200 m of the visit address; otherwise refused with the distance.
  3. **Check out:** then a required **visit outcome**: liked / not interested / wants another visit, feedback, next step.
- **Manager visit log:** each visit is Planned / Left office / ✅ Verified check-in / ⚠️ Check-in refused (with distance and attempts) / No-show, with timestamps.
- **Visit reminder** preview for the buyer (🎭).

### 8.7 M7 · Attendance — ✅ built (§3.13, §3.10 working hours)
- **Office check-in/out:** allowed only within 200 m of a registered office.
- **Field day:** an agent who starts the day in the field taps "Start field day". They count as present from their first verified client check-in.
- **Attendance register** (Manager/Owner): day and month grid with Present / Late / Field / Absent / On leave, and late marks counted against a grace period.
- **Correction request** ("Forgot to check in") → manager approves or rejects; the history is kept.
- **Settings:** offices with address and radius, working hours, grace period.

### 8.8 M8 · Leave management — ✅ built (§3.13); in the demo, leads move with "Start cover now" and come back with "Return leads"
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
- **2026-10-20:** Built M8: Leave tab (balances, validated apply form, my requests), manager approval with a cover agent (visits on leave days move now, leads when leave starts; demo Start cover now / Return leads), team calendar with holidays, on-leave status derived from approved leave. Updated §3.8, §3.13, §4–§7, §8.8.
- **2026-10-20:** Built M7: Attendance screen (My day with office check-in refused beyond the radius, field day, check-out, late marks; register for managers/owner; correction requests and approvals), check-in reminder on Today, working-hours settings, shared LocationControl. Section order fixed (§3.11 before §3.12). Updated §2, §3.1, §3.10, §3.13, §4–§7, §8.7.
- **2026-10-20:** Built M6: Visits screen (agent flow Left office → Check in → Check out → required outcome; manager visit log), check-ins refused beyond the radius or when imprecise, demo location control plus real browser location, Schedule visit dialog with WhatsApp confirmation, check-in radius setting, Visits phone tab (Properties moves to More). Storage bumped to v4. Updated §2, §3.1, §3.2, §3.10, §3.12, §4–§7, §8.6.
- **2026-10-20:** Built M3: Lead sources screen (connected status, weekly leads, first reply, editable cost per lead and team, spend totals), simulated arrivals with a New lead banner and routing (account menu, header or per source), "By source" routing now real, inbox source filter, fresh-enquiry chats. Updated §2, §3.1, §3.2, §3.10, §3.11, §4–§7, §8.2, §8.3.
- **2026-10-20:** Built M5: lead panel tabs (Overview / Timeline / Notes), structured buyer-brief editing with budget validation, tags with suggestions, team notes, activity timeline logged from every lead action, shared-lead warning and "Shared ×N" flag, duplicate-number check with Open / Merge on Add lead. Updated §3.1, §3.2, §3.7, §4–§7, §8.5.
- **2026-10-20:** Built M1 + M2: 22-person team, roles and permissions, "View as" switcher, role-based lead visibility and phone masking, lead owner card with reassign / hand to Sales and ownership history, Overdue/Unassigned flags, Escalations, Team (invite, deactivate with lead handover), Settings (separate pre-sales, routing, permissions table), Assign-to on Add lead, phone More sheet. Seed data grows to 12 leads. Fixed the desktop account menu opening off-screen. Updated §1–§7, §8.1, §8.2.
- **2026-10-20:** Product reframed for brokerages of 20–25 people (§1). Backlog replaced by the approved plan (§8): roles with optional separate pre-sales, phone masking, routing, lead arrival, chat automation, lead record, verified visit check-ins within web-app limits (200 m, no live tracking), attendance, leave with cover agent, performance reports, deal closing, inventory, notifications and audit, targeted AI assist, backend notes on Indian calling providers, and build order.
- **2026-10-20:** Design-system pass: all colours, spacing, radius, shadows and font sizes now come from tokens in `src/index.css` (161 scattered colours → one named set); text colours darkened to pass WCAG AA; shared `Dialog`, `HeatBadge`, `LeadActions`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge` replace duplicates. UX fixes: lead details sheet on phones, Back returns to the originating screen, reset asks for confirmation, "Up next" follows booked visits, dialog focus handling, no sticky hover on touch. Updated §2, §3.1, §3.2, §3.6, §5, §6, §7.
- **2026-10-20:** Spec rewritten to match commit `eb13612` (UI polish and module split): readable type scale, phone pipeline tabs, per-lead chat details, live numbers, saved messages, reset demo data, new code map. All sections updated.
- **2026-10-20:** Spec created from the Figma Make export (commit `0e43a34`).
