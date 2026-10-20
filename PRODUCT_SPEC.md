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
| Brand + status | Sidebar with Daira logo (tap → Today) and the **notifications bell** | Top bar: logo, "● WhatsApp connected" 🧱 (just the dot on phones narrower than 430 px), **notifications bell**, viewer's avatar (account menu), **+** add lead |
| Main nav | Sidebar **Work** group: **Today** (unread badge), **Visits**, **Pipeline**, **Properties**, **Follow-ups** (tasks-left badge), **Calls**, **Attendance**, **Performance**. **Manage** group, by permission: **Escalations** (red count; Manager/Owner), **Lead sources** (Manager/Owner), **Team** (Manager/Owner), **Settings** (Owner), **Audit log** (Owner) | Bottom tabs: **Inbox** (unread badge), **Visits**, **Pipeline**, **Tasks**, **More**. **More** opens a sheet with Properties, Calls, Attendance, Performance, plus the Manage screens the viewer may use (a red "!" on More when escalations are waiting) |
| Progress card | "Today's progress" ✅: buyers awaiting a reply · follow-ups left, with a progress bar of completed tasks. Says "You're all caught up" only when both are zero. Hidden on windows shorter than 940 px; the nav list scrolls if needed so the user card always stays on screen. | — |
| User card | Viewer's name and role ("Sales · Indiranagar") | — |
| Account menu | "⋯" next to the user card (opens upwards, beside the sidebar) | Viewer's avatar |
| Account menu contents | **Demo · View as** ✅: Arjun Khanna (Owner), Neha Kapoor (Manager · Indiranagar), Priya Nair (Sales · Indiranagar), Kiran Patel (Pre-sales). Then **Start guided demo** ✅ (§3.16), **Simulate incoming lead** ✅ (§3.11) and **Reset demo data** ✅ (asks to confirm first) | same |

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
- **Follow-up rate 82%** 🧱 (with three lead avatars). **Active value** ✅ = sum of budget midpoints of the leads the viewer sees (Owner with seed data: ₹27.4 Cr), with the open-lead count (closed leads excluded).
- **Lead inbox** ✅: filter *All / Hot / Warm / New*, a **source** dropdown (All sources + every source in the viewer's leads), plus search by name, requirement or locality. Subtitle counts conversations awaiting a reply. Each row: avatar (green dot if online), name, time since the last message, requirement · budget, last message, unread count, intent tag, green **Won** or grey **Lost** flag on closed leads, red **Overdue** flag (unread for more than 15 min), red-outlined **Shared ×N** flag (portal lead also sent to ~N other brokers), and "via <source>". Managers and the Owner also see the **owner** ("Priya N.") or a yellow **Unassigned** flag. Tapping a row opens the chat and **marks it read** ✅. Empty state when nothing matches.
- **Due today** ✅: up to 4 remaining follow-ups (time, title, lead). Tapping one, or **Open follow-ups**, goes to Follow-ups.
- Desktop: inbox and Due today side by side. Tablet/phone: stacked.

### 3.2 Lead conversation (WhatsApp chat + lead panel)
**Chat column**
- Header: **Back** returns to the screen the chat was opened from (Today, Pipeline, Follow-ups or Calls) ✅, avatar, status line, **Details** (phones only, opens the lead panel as a bottom sheet ✅), **Call** opens the call screen ✅. Status line 🎭 comes from lead data: "Online on WhatsApp", "Last seen <time> ago", or "New lead · <phone>" for leads added in the demo.
- **Brief strip:** requirement · budget · move-in timing (per lead).
- **Phone-only action buttons:**
  - **Share homes** ✅ opens the Share dialog (§3.4) for this lead.
  - **Plan visit** ✅ opens Schedule visit (below); once booked it reads "Visit booked" and opens Visits.
- Messages 🎭: the lead's own opening enquiry, an **Automatic** reply (tagged), a scripted reply with the lead's budget, the property card sent then (the best match from the seed listings, so adding listings later doesn't rewrite history), and the lead's latest message. Homes shared in the demo appear as a message with the listing cards and, a few seconds later, **"Seen"** 🎭 next to the time. Leads added in the demo start with an empty chat and a "Lead captured just now" note. Leads that **arrived from a source in the demo** show only the buyer's enquiry ("Just now").
- Quick replies ✅ fill the composer: "Suggest a time", "Share location" (or "Send a welcome message" for added and newly arrived leads), plus a **Templates** chip. The **+** menu offers *Property* (fills the best match's details) and *Location*.
- **AI drafts** ✅ 🎭 (sparkle button in the composer): three reply drafts for the buyer's last message: English, Hindi, Kannada + English. Picking one only fills the composer; nothing is sent automatically.
- **Templates** ✅: a sheet with Welcome / Share shortlist / Visit reminder / Follow-up. Fields (buyer name, property, day and time, your name) are prefilled and editable, with a live preview; **Send template** posts it tagged "Template · <name>".
- **24-hour window** ✅: if the buyer last wrote more than 24 h ago and hasn't written since, the composer is replaced by "Outside WhatsApp's 24-hour window · only approved templates can be sent" with **Use a template** (seed: Ishita, quiet for 1 day).
- **Auto-qualification** ✅ 🎭 for leads that arrived in the demo (when auto-reply and qualifying questions are on): the automatic reply, then three questions and the buyer's answers appear one by one (~1.4 s apart; "Auto-qualifying… 2 of 3"), resuming if you leave and return. The answers become **AI suggestions**, not changes: a link in the chat and a box in the brief.
- Sending ✅ adds the message to the thread. Messages (yours, automatic and the buyer's scripted answers) are **saved per lead** and survive switching leads and refreshing.
- The thread scrolls to the newest message.

**Lead panel** (side panel on desktop/tablet; bottom sheet from **Details** on phones), in three tabs: **Overview · Timeline · Notes** (counts in the labels).

*Overview tab*
- **Lead owner card** ✅: owner's name and role (or "Unassigned").
  - Manager/Owner: **Reassign** (or **Assign**) opens a people picker with open-lead counts and a reason (Workload balance / Locality expertise / Leave cover / Buyer request / Other).
  - Pre-sales, when the lead is theirs and *Separate pre-sales team* is on: **Hand to Sales** (picker of Sales people). The lead then leaves their view and the chat closes.
  - Sales: no reassign button.
- **Ownership history** ✅ under the card: each change with new owner, reason, previous owner, who did it and when.
- Stage name, budget, requirement, intent tag.
- **AI score** 🎭: 0–100 with Hot / Warm / Cool and the reasons ("budget confirmed · visit planned · replied 2 min ago · also with ~6 brokers").
- **Shared-lead warning** 🎭 (portal leads only): "Also sent to ~6 brokers by 99acres. Call now to be first."
- **Stage track** ✅ shows the lead's real stage: New / Qualified / Visit / Offer.
- **Buyer brief** (per lead): when AI has suggestions from the chat, a "Suggested from the chat" box lists them (budget, looking for, move-in) with **Accept** (applies them and logs it) or **Dismiss**. Then purpose (Live-in / Investment), localities, move-in, must-have, phone, source. **Edit** ✅ opens a form with structured fields: Looking for (2/3/4 BHK, Villa, Plot), Purpose, budget from/up to in ₹ Cr (must be max ≥ min, otherwise Save is disabled with an error), localities (comma separated; the first is the main one), Move-in, Must-haves. Saving rebuilds the requirement and budget text everywhere (inbox, pipeline, totals) and adds a timeline entry. On phones, Edit closes the sheet and opens the form. **Phone numbers are masked** (`+91 98XXX XX018`) for Sales and Pre-sales; Managers and the Owner see full numbers.
- **Deal** panel ✅ (leads in Negotiation, closed leads, or any lead with a recorded offer), above the buyer brief: asking, buyer's offer, agreed, token, commission split, and a **document checklist** (Buyer KYC, Token receipt, Sale agreement; tap to tick, logged on the timeline). **Edit** / **Add offer** opens the deal dialog; **Mark lost** / **Mark won** as on the pipeline. Closed leads show "Won" or "Lost · reason", the stage label reads Won/Lost, and **Reopen deal** is offered.
- **Tags** ✅: applied tags as removable chips; **+ Tag** shows suggestions (First-time buyer, Loan needed, NRI, Investor, Urgent, Price sensitive, Repeat client) and a custom-tag field (Enter to add).
- **Matches · N** ✅: the best listing as a card with its reasons ("Indiranagar", "3 BHK", "In budget"; weaker ones like "6% over budget" or "On hold" in amber), then up to 3 more with their reasons. Listings already sent show **Sent** or **Seen**. With none: "No listing fits this brief yet." Matching (`matchesForLead` in `src/data/inventory.ts`): one of the buyer's localities +3, BHK or villa as asked +2 (any apartment +1 if no size was given), in budget +3 (up to 10% over +1), on hold −1; sold listings never match; a match needs 4 or more. Editing the brief changes the matches straight away.
- **Share homes** ✅ opens the Share dialog (§3.4).
- **Schedule visit** ✅ opens a dialog: property (matched one preselected), day (Today … 6 days ahead; defaults to the coming Saturday), time slot, and agent (the lead owner; only Managers/Owner can change it). Booking posts a WhatsApp confirmation in the chat ("Visit confirmed: The Courtyard House, Indiranagar, Tomorrow at 3:00 PM…") 🎭, moves the lead to *Visit planned* (never backwards), and logs it. When a visit is booked the button reads "Visit booked · Tomorrow · 3:00 PM" and opens Visits.

*Timeline tab* ✅: everything on the lead, newest first. Demo actions are logged as they happen (with who did it): messages sent, assignments, stage moves, visits booked, calls saved, notes, tag changes, brief edits, merged enquiries. Below them, events implied by the seed data: the buyer's latest message, seeded call recordings, the seeded visit, "Assigned to … by routing", and "First enquiry via <source>" last.

*Notes tab* ✅: private team notes (not sent to the buyer). Add with the text box; each note shows author and time.

### 3.3 Pipeline
- Stages: **New lead → Qualified → Visit planned → Negotiation**, plus a **Closed** column for won and lost deals.
- Summary: Open deals ✅ (with "N won · N lost"), Visits planned ✅ (open leads in *Visit planned*), Likely commission ✅ = sum of budget × 2% fee × stage close probability (10% / 30% / 60% / 80%), over the open leads the viewer sees. Closed leads are left out of active value and likely commission everywhere.
- **Hot leads only** filter toggle ✅.
- Deal card: person (tap → chat), requirement (Managers/Owner also see the owner or "Unassigned"), budget (or the buyer's **Offer** when one is recorded), last WhatsApp message, intent tag, a **back** arrow (moves one stage back) and **Move to <next stage>** ✅. Cards in Negotiation show **Lost** and **Won** instead of Move.
  - **Won** opens the deal dialog: asking price, buyer's offer, **agreed price (required)**, token amount (₹ L) and the **commission split** (people + %, must add up to 100%; defaults to the owner 100%, or 90/10 with the Pre-sales person who handed the lead over). Saving moves the card to Closed ("Won at ₹3.2 Cr") and the commission counts on the leaderboard (§3.14).
  - **Lost** asks for a reason (Bought through another broker, Budget too low, Stopped responding, Loan not approved, Changed plans, Other); the card moves to Closed with the reason.
  - Closed cards have **Reopen**, which returns the lead to its stage.
  - Every move, offer, document and closure is written to the lead's timeline. Stages and deals are saved locally.
- Desktop: 5 columns; open cards can be **dragged** between the four stages (every move also has a button). Tablet: 2-column grid, Closed full width. Phone: **stage tabs** with counts (incl. Closed), opening on the first stage that has deals.

### 3.4 Properties / inventory (M11)
- Header: "6 available · 1 on hold · 1 sold" (live) and **Add property** (Owner, Managers and Sales; not Pre-sales).
- Filters ✅: locality chips (All + every locality that has a listing) and availability (All / Available / On hold / Sold).
- Listing card: photo (or a placeholder for listings added in the demo), availability tag, **Save** bookmark ✅, locality, name, BHK (or "4 BHK villa"), sq ft, **Listed by** (listing agent), **Owner** name and number, price, **Edit** (same people as Add) and **Share** (disabled when sold).
- **Owner's number** is shown in full to Managers, the Owner and that listing's agent; everyone else sees it masked (`+91 99XXX XX244`). When someone who can't see it edits the listing, the number field is locked.
- **Add / Edit property** ✅: name, locality (Indiranagar, Whitefield, HSR Layout, Koramangala), bedrooms (1–5 BHK), type (Apartment / Villa), asking price (₹ Cr), carpet area (sq ft), availability, listing agent, owner's name and 10-digit mobile. Errors show on Save (name, price, area, owner name, mobile). Changes show up in matches immediately. Added listings get the locality's centre as their address (used for visit check-ins).
- **Share dialog** ✅ (from a listing, or **Share homes** on a lead):
  - From a listing it first asks **which lead**: open leads, searchable, best fit first, each with the reasons this listing fits them (or "Not a close match").
  - Then: the lead's **matches** with reasons and Sent/Seen tags, tickable (the top 3 available are pre-ticked when opened from a lead; the listing itself when opened from a listing), **Show all homes** to pick any unsold listing, and a live **WhatsApp preview** ("Hi Ananya, here are 2 homes that match your brief: … Tell me which ones you'd like to visit.") with the listing cards.
  - Outside WhatsApp's 24-hour window the preview says it goes as the **"Share shortlist" template** and is tagged that way.
  - **Send** posts it into the chat, logs it on the timeline, records Sent per listing, and flips to **Seen** about 4 seconds later 🎭.

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
- Recording list: play/pause toggle (visual only 🎭, moving playhead), waveform, duration, note. Calls saved in the demo get an **AI summary** 🎭 as their note (what was discussed and the next step), labelled "AI summary" and logged on the lead's timeline. Search by buyer ✅. Tapping a person opens the chat.
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
- **Roles** (permission bundles; one person can hold several): **Owner**, **Manager**, **Sales**, **Pre-sales**. Permissions: see all leads · see team's leads · assign/reassign · see full phone numbers · invite/deactivate people · change settings · view reports · export · hand leads to Sales · add and edit properties (Owner, Manager, Sales) · see property owners' numbers (Owner, Manager) · see the audit log (Owner) (table in §3.10).
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
- **WhatsApp auto-reply** ✅: on/off; the message (`{name}` = buyer's first name); **Ask qualifying questions** on/off (budget, area and bedrooms, move-in; answers become AI suggestions to confirm).
- **Field check-ins and attendance** ✅: check-in radius 100 / 200 / 300 / 500 m (default 200); working hours (start 9:00 / 9:30 / 10:00 AM, grace 10 / 15 / 30 min; defaults 9:30 and 15); the three offices with addresses.
- **Roles and permissions** table 🧱 (read-only; custom roles later).

### 3.11 Lead sources and arrivals (M3)
- **Lead sources screen** (Manager/Owner; editable by the Owner only):
  - Stat strip: leads this week (all sources), spend this week (leads × cost per lead), blended cost per lead.
  - One row per source: 99acres, MagicBricks, Housing (Portal, "shared with ~N brokers"), Facebook ads (Ads), WhatsApp (Messaging), Walk-in, Referral, Quick capture (Offline, "Manual entry").
  - Each row: status (Connected / Not connected / Manual entry), leads this week 🧱, first-reply time 🧱, **cost per lead** (₹, editable by the Owner, totals update live), **Feeds team** (used by "By source" routing; editable by the Owner), **Disconnect/Connect** 🎭 (online sources, Owner), **Simulate** (online sources while connected).
  - **Simulate new lead** in the header rotates through connected sources.
- **Simulated arrival** ✅ (header button, a row's Simulate, or account menu → *Simulate incoming lead*, available to every role):
  - The next buyer from a pool of 6 (Meera Iyer, Arvind Rao, Sunita Reddy, Karan Malhotra, Fatima Sheikh, Harish Gowda) arrives from that source with 1 unread message, budget "to qualify", an automatic reply (if on), the portal's "shared with ~N" figure, and an owner from the company routing rule (§3.10), recorded in ownership history and the timeline ("New enquiry via 99acres · routed to …").
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

### 3.14 Performance & insights (M9)
Monthly figures (leads handled, visits booked/verified, deals, commission, first reply, follow-ups on time, last month's figures for trends) are **generated per person** 🧱, because the prototype has no history. **Live** parts: today's verified check-ins (added to verified visits this month), deals won in the demo (this month's commission gets agreed price × 2% × the person's split share; deals closed counts a won deal for anyone with ≥ 50% of the split), pipeline value, open leads, attendance, overdue leads, requests and visits.
- **Sales / Pre-sales — "My performance":** period (This month / Last month), "You're #4 of 15 salespeople by commission" (their rank only), and their **scorecard**.
- **Manager — "<Team> team performance"; Owner — "Performance & insights" (with a team filter):**
  - **AI weekly digest** 🎭: plain-language lines built from the numbers the viewer can see (pipeline, top performer, overdue and unassigned leads, stuck leads, people not checked in).
  - **Daily summary** ✅ (live, tappable): overdue leads → Escalations, not checked in → Attendance, visits today → Visits, requests waiting (leave + corrections) → Attendance.
  - **Leaderboard** (salespeople in scope): metric picker (Commission, Deals closed, Verified visits, First reply — lower is better, Follow-ups on time), ranked bar chart with value at the tip and hover/focus tooltip; tap a person for their scorecard.
  - **All numbers** table (the table view of the leaderboard): deals vs target, commission (green when target met), verified visits, first reply, on time.
- **Scorecard** (sheet): targets with progress meters (deals 3, commission ₹12 L, verified visits 12 a month; green with "target met"), change vs the other month (▲/▼, green when better), funnel (leads → visits booked → verified → deals), attendance counts for the last 10 working days, today's verified/refused check-ins.
- **Owner insights:** weighted pipeline forecast by stage (live), commission by team, **what a deal costs per lead source** (spend from the live cost per lead on Lead sources × this month's leads ÷ deals), first-reply time bands, lost-deal reasons, **stuck leads** (more than 7 days in a stage; tap to open), property interest for every listing (visits booked live; WhatsApp shares = monthly figure + shares in the demo), Pre-sales leads handled and first reply.
- Charts follow the dataviz rules: one series, one colour, no legend, bars ≤ 24 px with rounded ends, value at the tip, tooltip on hover/focus, a table alongside.

---

### 3.15 Notifications and audit log (M12)
- **Bell** ✅ (sidebar on desktop/tablet, top bar on phones) with a red count of the viewer's **unread** notifications. Each person sees only their own; "View as" switches them.
- **Notifications panel** (sheet on phones): "N unread", **Mark all read**, then a red **needs attention** row when leads the viewer can see are overdue ("4 leads are waiting over 15 min for a reply" → Escalations for Managers/Owner, Today for others), then the list, newest first, unread in bold with a dot. Tapping one marks it read and opens its lead's chat (if the viewer can still see the lead) or its screen (Visits, Attendance).
- **What creates one** (never for the person who did it):
  - a lead assigned to you (by a person, routing, Add lead, a leave cover or a deactivation) and, to the previous owner, "X moved to Y";
  - leave requested → the person's team manager and the Owner; approved → the person and the cover; declined → the person;
  - attendance correction requested → manager and Owner; decided → the person;
  - a refused visit check-in → the agent's manager and the Owner;
  - a deal won → the owner's manager and the Owner.
- **Audit log** ✅ (Owner only; nav **Audit log**): newest first, who (avatar, short name), when, type and what. Types with counts as filter chips: Reassignments, Team (invite, deactivate with lead count, reactivate), Settings (pre-sales switch, routing, radius, work hours, auto-reply on/off/message, lead-source cost/team/connection), Properties (added; edited with what changed: price, availability, listing agent, owner contact), Deals (won with price, lost with reason, reopened), Exports. Repeated edits of the same setting by the same person update one entry, so typing a cost doesn't flood the log.
- **Export leads** and **Export log** ✅ download CSV files in the browser (`daira-leads.csv`: name, phone, source, owner, stage or Won/Lost, budget, looking for, localities; `daira-audit-log.csv`) and are themselves logged.
- Not built: logging each time someone views a full phone number (Managers and the Owner always see full numbers in this prototype); editing permissions (the table is read-only, so there are no permission changes to log).

### 3.16 Guided demo (presenter mode)
- **Start guided demo** (account menu) opens a dark panel bottom right (above the tab bar on phones) for whoever is presenting to a client. It can be minimised to a "Demo · step N of 10" pill or ended at any time, and each step has **Skip**.
- Each step shows what to point out and one button that does it with the real demo actions (so everything it does also lands on timelines, notifications, the audit log and reports). After it runs, the button becomes **Next step**.
  1. **A buyer enquires on 99acres**: switches to the Owner, a 99acres enquiry arrives (the next simulated buyer; Meera Iyer on fresh data), routed to Pre-sales with the auto-reply, and its chat opens.
  2. **Auto-qualification and the AI brief**: waits ("Waiting for the buyer's answers…") until all questions are answered, then **Accept the AI brief**.
  3. **Pre-sales hands over to Sales**: reassigns to the first active salesperson in the lead's locality team (Sneha P. for HSR Layout; Priya N. if there's no team).
  4. **Share a match and book the visit**: shares the best match on WhatsApp and books a visit today at 4:00 PM with that salesperson, confirmed in the chat.
  5. **Switch to <agent>'s phone**: View as the salesperson, opens Visits.
  6. **A check-in from the wrong place is refused** (1.4 km away; their manager and the Owner are notified).
  7. **A verified check-in at the property**.
  8. **Visit outcome**: checks out with "Liked it" and a next step.
  9. **Negotiate and win**: moves to Negotiation, records the deal (asking = listing price, agreed = 98% of it, ₹5 L token, KYC and token receipt done, 100% to the salesperson), marks it won, opens Pipeline.
  10. **The leaderboard moves**: back to the Owner on Performance; the salesperson's commission this month rises by agreed price × 2%.
- The finish card suggests resetting demo data before the next client. The guide's place in the script is not saved; reloading the page ends it.

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

  Each lead also has a phone number, minutes since the last message, move-in timing, must-haves, opening enquiry and latest message. Ishita Banerjee last wrote 1 day ago (outside the 24-hour window). Portal leads carry a "shared with ~N brokers" figure 🎭: Ananya 6, Deepak 5, Farhan 4, Gaurav 3, Ishita 6. Vikram and Sanjay are marked Investment. The Owner's totals with this data: active value ₹27.4 Cr across 12 leads.
- **Properties (8, `inventory.ts`):** The Courtyard House (Indiranagar, 3 BHK, ₹2.65 Cr, Priya) · Windermere Residences (Whitefield, 4 BHK villa, ₹3.40 Cr, Vivek) · Lakeview Terraces (HSR Layout, 2 BHK, ₹1.48 Cr, Sneha) · Palm Grove Villas (Whitefield, 4 BHK villa, ₹4.20 Cr, Manoj) · Indigo Heights (Indiranagar, 2 BHK, ₹1.62 Cr, Aditya) · Maple Court (HSR Layout, 3 BHK, ₹1.95 Cr, Rohit) · Brookside Towers (Whitefield, 2 BHK, ₹1.12 Cr, **on hold**, Ritu) · Cedar Row (Indiranagar, 3 BHK, ₹3.10 Cr, **sold**, Kavya). Each has an owner name and number. Photos load from Unsplash, so the demo needs internet.
- **Deals (`deals.ts`):** Rohan & Meera (asking ₹3.4 Cr, offer ₹3.2 Cr, split Vivek 100%) and Lavanya Subramaniam (asking ₹4.2 Cr, offer ₹4.0 Cr, split Manoj 100%), both with Buyer KYC received. No deals are closed at the start.
- **Notifications and audit (`notifications.ts`):** unread for Arjun (Vivek's refused check-in, Aditya's leave request; Rohit's request already read), Rahul (the refused check-in), Neha (Aditya's request), Farah (Rohit's request), Priya (Ishita routed to her) and Kiran (Pooja routed to her). Audit log: 5 earlier entries (radius set to 200 m, two reassignments, a 214-row export, Lakshmi invited).
- **Performance (`performance.ts`):** generated monthly figures and targets per person, response-time bands, lost reasons, per-source visits/deals, days-in-stage for stuck leads, property shares.
- **Leave (`leave.ts`):** Kavya (Casual, 3 days ago → tomorrow, approved, cover Sameer); Aditya (Casual, in 2–3 days, pending, 1 lead); Rohit (Sick, tomorrow, pending; he has a visit tomorrow). Allowances 8 / 6 / 15 and generated days already used.
- **Attendance (`attendance.ts`):** generated history for the last 10 working days; today's records (most people checked in, some late or in the field; Priya, Neha, Kiran and Sameer not yet, so the demo can do it); Kavya on leave; one pending correction from Sameer for 3 working days ago.
- **Visits and offices (`visits.ts`):** 6 seed visits (§3.12); offices in Indiranagar (HQ), Whitefield and HSR Layout with coordinates. Properties also carry coordinates.
- **Lead sources (8, `sources.ts`)** with weekly leads, first-reply minutes, default cost per lead (₹450 / 400 / 350 / 180 / 0…) and default team; plus the pool of 6 buyers used for simulated arrivals.
- **Tasks (8)** and **recordings (5)** linked to the leads above, plus the one optional "Add reminder" task (attached to the viewer's first lead).
- **Fixed demo numbers** (`DEMO_METRICS`): follow-up rate 82% (+12%), weekly chart values, 18 calls this week (2h 14m), 72% answer rate (+8%).

## 5. Saved in the browser (localStorage)
All keys use the prefix `daira:v5:`: `viewer`, `settings`, `pretend-location`, `attendance-today`, `corrections`, `leave`, `added-members`, `member-status`, `added-leads`, `owners`, `assignments`, `lead-edits`, `notes`, `tags`, `activity`, `source-settings`, `arrivals`, `stages`, `deals` (offers, documents, splits), `closures` (won/lost), `visits` (visit records with steps and outcomes), `read-leads`, `chats`, `ai-suggestions`, `qualify-steps`, `tasks`, `completed-tasks`, `recordings`, `saved-properties`, `properties` (inventory incl. edits and additions), `property-shares` (Sent/Seen per lead), `notifications` (everyone's, with read state), `audit`.
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
- `src/data/inventory.ts`: listing model, seed listings, localities, price/BHK/area labels, `matchesForLead` (scored matches with reasons).
- `src/data/notifications.ts`: notification and audit-entry types, their seed entries, audit type labels.
- `src/data/deals.ts`: deal model (offer, token, documents, commission split), lost reasons, seed deals.
- `src/data/performance.ts`: generated monthly figures, targets and insight data.
- `src/data/templates.ts`: WhatsApp templates, the 24-hour window, default auto-reply, qualification questions.
- `src/state/useDemoStore.ts`: all saved state, the viewer, visibility filtering, routing, activity log and timeline, duplicate lookup, derived numbers and actions.
- `src/lib/`: `ai.ts` (demo AI: reply drafts, lead score, call summary, weekly digest), `location.ts` (one-off location readings: demo readings, the browser's real location, distance), `permissions.ts` (role → permissions, who sees which lead), `storage.ts` (localStorage), `format.ts` (dates, money, durations, phone masking), `csv.ts` (CSV text and browser download), `useEscapeKey.ts`.
- `src/components/`: `DemoGuide` (guided demo panel), `AppNavigation` (sidebar with Work/Manage groups, phone top bar, tab bar with More sheet), `navigation.ts` (items with required permission), `Dialog` (the one modal / sheet / full-screen shell), `AccountMenu`, `Avatar`, `HeatBadge`, `LeadActions`, `LeadRow`, `LeadTimeline`, `LeadNotes`, `LeadTags`, `IncomingLeadBanner`, `LocationControl` (demo location picker), `BarList` (single-series bar chart), `PropertyCard` (also `PropertyPhoto`), `NotificationBell` (bell + notifications panel), `Toast`, `Icon`.
- `src/views/`: `TodayView`, `ChatView` (chat + lead panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`, `VisitsView` (with the visit outcome form), `AttendanceView` (My day, Leave, Register with team calendar, Requests), `ReportsView` (my performance, leaderboard, scorecard, owner insights), `EscalationsView`, `LeadSourcesView`, `TeamView` (with invite dialog), `SettingsView`, `AuditView` (Owner's audit log with CSV exports).
- `src/modals/`: `AddLeadModal` (with duplicate check), `EditLeadDialog` (structured buyer brief), `ScheduleVisitDialog`, `TemplateDialog`, `AssignDialog` (people picker for assign / reassign / hand-off / deactivate), `DealDialog` (offer tracker + commission split; also `LostDialog`), `PropertyDialog` (add/edit listing), `ShareDialog` (pick lead → pick homes → WhatsApp preview → send), `CallPicker`, `CallModal`.
- `src/index.css`: the only place raw colours are defined. Design tokens (colour, 4px spacing scale, radius, shadow, `--fs-*` type sizes, `--tap`) and shared classes (`.btn`, `.card`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge`, `.is-done` and more).

---

## 7. Known issues
- Navigation labels differ between phone and desktop (Today/Inbox, Properties/Homes, Follow-ups/Tasks).
- Due today items open the Follow-ups page, not the lead's chat.
- On phones the toast can cover the chat composer for 2.6 s.
- On desktop, Add lead is only on Today.
- Sent messages show "Now" forever; lead times ("2m", "18m") and message timestamps are fixed seed values, so "Overdue" never appears or clears on its own.
- The permissions table can't be edited.
- All AI output is fixed demo text built from the lead's data, not a model; templates aren't really Meta-approved; the 24-hour window uses the seeded "minutes ago".
- Performance figures are generated; only deals won in the demo and today's check-ins are added live. Only managers' and the owner's views show other people.
- Leave counts calendar days (weekends and holidays included). Leave can't be cancelled by the person once requested.
- Today's attendance doesn't roll over at midnight (the demo always shows one "today"); history before today is generated, not recorded.
- Visit step times use the real clock, but visit days are relative to today, so the demo always looks like "today". Nothing marks a visit as a no-show automatically, and visits can't be rescheduled or cancelled yet.
- Lead-source weekly figures and first-reply times are fixed; connecting a source is a toggle, not a real login. Simulated buyers repeat after 6 arrivals.
- Newly invited people can't log in (there is no login); they only appear in Team and pickers.
- Activity logged in the demo always says "Just now"; seeded timeline entries use fixed labels ("Earlier", "On arrival").
- Tags don't filter the inbox yet.
- Listings added in the demo have no photo upload. "Seen" is simulated, and it stays "Sent" if the page is reloaded within those 4 seconds.
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

### 8.4 M4 · Chat and auto-reply — ✅ built (§3.2, §3.10, §3.11)
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

### 8.9 M9 · Performance and reports — ✅ built (§3.14); monthly figures are generated demo data
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

### 8.10 M10 · Deal closing — ✅ built (§3.2 Deal panel, §3.3, §3.14); offer dates are not tracked
- **Won/Lost** stages (lost needs a reason); **move back** a stage; desktop drag-and-drop.
- **Offer tracker:** asked / offered / agreed price, token amount.
- **Document checklist:** KYC, token receipt, agreement.
- **Commission split** between people (e.g. Pre-sales 10% / Sales 90%), feeding the leaderboard.

### 8.11 M11 · Inventory — ✅ built (§3.2 Matches, §3.4); no photo upload
- **Add/edit property**, availability (Available / On hold / Sold), listing agent, **owner contact** (masked from Sales).
- **Matches for this lead** with reasons ("In budget · 3 BHK · Indiranagar"); pick several → **WhatsApp preview** → sent (🎭) → "Viewed" (🎭).

### 8.12 M12 · Notifications and audit — ✅ built (§3.15); full-number views and permission changes are not logged (see §3.15)
- **Notifications centre:** lead assigned, overdue, check-in refused, leave request or decision, reassignment.
- **Audit log** (Owner): exports, reassignments, full-number views, permission changes, deactivations.

### 8.13 M13 · AI assist (targeted, every output reviewed by a human) — ✅ built as demo text (§3.2, §3.6, §3.14)
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
7. **Demo mode** — ✅ built as the guided demo (§3.16): a scripted run across all of the above (new 99acres lead → auto-reply → AI-filled brief → assigned → visit with verified check-in → won → leaderboard moves).

---

## 9. Changelog
Newest first. One line per change: date, what changed, which section was updated.
- **2026-10-20:** Built Demo mode: **Start guided demo** in the account menu opens a 10-step presenter panel that runs the full loop with real demo actions (99acres enquiry → auto-qualification and AI brief → hand to Sales → share and book → refused then verified check-in → outcome → won → leaderboard), with Skip, minimise and end. Updated §2, §3.16, §6, §8.16.
- **2026-10-20:** Built M12: notifications bell and panel (per person, unread count, needs-attention row, mark all read; created by assignments, leave and correction requests/decisions, refused check-ins, won deals), Owner-only Audit log (reassignments, team, settings incl. lead sources, properties, deals, exports; repeated edits coalesce) with leads and log CSV export. New permission: see the audit log. Phone top bar shows only the WhatsApp dot under 430 px. Updated §2, §3.8, §3.15, §4–§6, §8.12.
- **2026-10-20:** Built M11: 8 listings with availability, listing agent and owner contact (masked unless Manager/Owner/listing agent), Add/Edit property, availability filter, scored matches with reasons in the lead panel, Share dialog (pick lead or homes → WhatsApp preview → send, template outside 24 h → Seen), shared listings in the chat, per-listing shares on Performance. New permissions: add/edit properties, see owners' numbers. Removed fixed known issues (Matches/Share, pipeline tab, deals). Updated §3.2, §3.4, §3.8, §3.14, §4–§7, §8.11.
- **2026-10-20:** Built M10: Closed pipeline column with Won (agreed price + commission split adding to 100%) and Lost (reason), Reopen, move back, desktop drag-and-drop, phone tabs open on the first non-empty stage; Deal panel on the lead (offer tracker, document checklist, split); won deals feed this month's leaderboard; Won/Lost inbox flags; closed leads leave active value. Updated §3.1–§3.3, §3.14, §5, §6, §8.10.
- **2026-10-20:** Built M4 + M13: automatic replies (tagged) on arrival, animated auto-qualification whose answers become AI suggestions to accept, templates with fields and preview, 24-hour window lock, AI reply drafts (English/Hindi/Kannada), AI lead score, AI call summaries, AI weekly digest, auto-reply settings. Automatic actions are credited "Automatic". Fixed duplicate timeline ids. Storage bumped to v5. Updated §3.2, §3.6, §3.10, §3.11, §3.14, §4–§7, §8.4, §8.13.
- **2026-10-20:** Built M9: Performance screen (my performance and rank; manager/owner daily summary, leaderboard, numbers table, scorecards; owner insights incl. cost per deal by source, pipeline forecast, stuck leads), BarList chart component. Sidebar nav now scrolls and hides the progress card on short windows. Updated §2, §3.14, §4, §6, §7, §8.9.
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
