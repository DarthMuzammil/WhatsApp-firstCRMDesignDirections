# Bayana: Product Spec (living document)

> **What this is:** the single source of truth for what the prototype does *right now* (§2–§7) and for the approved plan (§8). §8 is a plan, not a description of the app: when a planned item ships, move it into §2–§7 and mark it built.
> **Who updates it:** whoever changes the app (person or AI) updates this file in the same commit as any feature, workflow, data or UI change (see `AGENTS.md`). If the code and this doc disagree, that's a bug in one of them.
>
> **Status labels:** ✅ Works (interactive, state changes) · 🎭 Simulated (looks real, but scripted or fixed) · 🧱 Static (hard-coded display only)

---

## 1. Product in one paragraph
Bayana is a WhatsApp-first CRM for **real estate brokerages of 20–25 people** in India, starting with Bengaluru: an owner, team managers, field agents and (in some companies) separate telecallers. Agents work from their phones: leads arrive, conversations happen on WhatsApp, matching homes get shared, visits are planned and verified, and follow-ups are kept. Managers and owners see the team: who is handling which lead, who turned up, who is performing. All of it happens in one place instead of across WhatsApp, Excel and a paper diary. This repo is a **UI-only prototype** for customer demos. There is no backend; data is seeded in code, changes are saved in the browser's localStorage, and anything a backend would do (portal sync, WhatsApp delivery, calling, GPS, AI) is **simulated with scripted data**.

**People in the prototype:** a 22-person brokerage, **Better Days Realty** (the workspace name; buyers see it in every WhatsApp message, set in `src/data/brand.ts`), (owner Arjun Khanna, 3 team managers, 15 Sales, 3 Pre-sales). The demo **"View as"** switcher (account menu) shows the app as the Owner, a Manager, a Sales agent or a Pre-sales telecaller; data visibility, phone masking and navigation change with the role (§3.8).

> **Positioning note:** the research PRD targeted solo brokers and 2–5 person shops. At 20–25 seats Bayana competes directly with Leadrat and LeadSquared, so per-seat pricing needs revisiting. The edge remains: phone-first for agents in the field, WhatsApp-native, verified visits, and leave-aware lead handover.

**Differentiators the product must make obvious** (from the research PRD):
1. Speed to lead: instant WhatsApp reply and qualification for portal leads.
2. Stale lead awareness: enquiries that have waited too long are flagged and escalated; repeat enquiries are merged.
3. Rule-based property matching, shared on WhatsApp in one tap.
4. A "Today" view of the broker's day: visits, follow-ups, cold leads.
5. Mobile-first and offline-tolerant, with simple INR pricing.

> Differentiators 1, 2 and 5 are **not in the UI yet**, and 3 and 4 are partial. See §8 (Planned modules).

---

## 2. Navigation & layout
Layouts: **phone** ≤ 760px, **tablet** 761–1100px, **desktop** > 1100px. Every tappable control on phones is at least 44px.

| Area | Desktop / tablet | Phone |
|---|---|---|
| Brand + status | Sidebar with the Bayana mark and name, the workspace name "Better Days Realty" under it (tap → Today), the **notifications bell** and a mint **Add lead** button | Top bar: the Bayana mark and name only (the workspace name is in the account menu, so the two names never crowd the bar), "● WhatsApp connected" 🧱 (just the dot on phones narrower than 430 px), **notifications bell**, viewer's avatar (account menu), **+** add lead |
| Main nav | One name per screen on every size. Sidebar **Work** group: **Today** (unread badge), **Visits** (people who run visits: Owner, Managers, Sales), **Pipeline**, **Properties**, **New launches** (everyone; §3.18), **Follow-ups** (tasks-left badge), **Calls**, **Attendance**, **Performance**. **Manage** group, by permission: **Brokerage** (Manager/Owner; §3.17), **Escalations** (red count; Manager/Owner), **Lead sources** (Manager/Owner), **Team** (Manager/Owner), **Settings** (Owner), **Audit log** (Owner) | Bottom tabs: the first four of **Today** (unread badge), **Visits**, **Pipeline**, **Follow-ups**, **Calls** the viewer may use (Pre-sales: Today, Pipeline, Follow-ups, Calls), then **More**. **More** opens a sheet with the rest (Properties, Calls or Visits, Attendance, Performance), plus the Manage screens the viewer may use (a red "!" on More when escalations are waiting) |
| Progress card | "Today's progress" ✅: buyers awaiting a reply · follow-ups left, with a progress bar of completed tasks. Says "You're all caught up" only when both are zero. Hidden on windows shorter than 940 px; the nav list scrolls if needed so the user card always stays on screen. | — |
| User card | Viewer's name and role ("Sales · Indiranagar") | — |
| Account menu | "⋯" next to the user card (opens upwards, beside the sidebar) | Viewer's avatar |
| Account menu contents | **Workspace · Better Days Realty**, then **Demo · View as** ✅: Arjun Khanna (Owner), Neha Kapoor (Manager · Indiranagar), Priya Nair (Sales · Indiranagar), Kiran Patel (Pre-sales). Then **Start guided demo** ✅ (§3.16), **Simulate incoming lead** ✅ (§3.11), **Simulate a forwarded group message** ✅ 🎭 (§3.7: the phone's "Share to" sheet with WhatsApp, **Bayana**, Messages, Copy; Bayana opens Add lead in paste mode with sample 1) and **Reset demo data** ✅ (asks to confirm first). **Escape** closes the menu. | same |

While a chat is open, the nav keeps the screen it was opened from highlighted. **On phones an open chat is full screen** (no top bar or tab bar, like WhatsApp); **Back** returns to the screen it came from. If switching "View as" hides the open lead or screen, the app falls back to that screen or to Today.

Toasts confirm actions at the top of the screen for 2.6 s, with a tick; refusals (e.g. a check-in from too far away in the guided demo) show a red alert icon instead. Dialogs close with **Escape** or by tapping outside, keep keyboard focus inside while open, and return focus to the button that opened them. On phones, pickers and lead details open as bottom sheets.

---

## 3. Screens & workflows

### 3.1 Today (home / inbox)
- Header: today's real date ✅; title "Your day, at a glance" (Sales/Pre-sales) or "Your team today" (Manager/Owner); search toggle ✅. (Add lead is in the sidebar on desktop/tablet and the top-bar **+** on phones.)
- Every number and list on this screen covers only the leads the viewer may see (§3.8).
- **Registration banner** ✅ (Sales and Pre-sales, M14): for each developer registration on the viewer's leads that lapses within 3 days, an amber banner "Ananya Rao's registration with Kestrel Developers expires in 3 days" with **Open lead** and **Renew** (§3.18).
- **Check-in reminder** ✅ for anyone who tracks attendance and hasn't checked in today: "You haven't checked in today · Work starts 9:30 AM" with **Check in** (opens Attendance).
- **Three layouts, by what the viewer does all day:**
  - **Managers and the Owner — team home:** the **daily summary** tiles ✅ (live, tappable: Overdue leads → Escalations, Not checked in → Attendance, Visits today → Visits, Requests waiting (leave + corrections) → Attendance; seed for the Owner: 4 · 4 · 4 · 3); for people who see receivables, the **Brokerage from developers** card ✅ (§3.17: "Brokerage pending · ₹42 L · 3 overdue" and "Overdue · ₹15.4 L · oldest 43 days (Halcyon Habitats)", both opening Brokerage on Overdue, and "Registrations · 3 expiring this week · 1 lapsed", opening New launches → Registrations; Neha: ₹18.5 L · 1 overdue, 1 expiring · 1 lapsed); then the lead inbox beside the **AI weekly digest** 🎭 ("What needs your attention": pipeline, top performer, overdue and unassigned leads, stuck leads, people not checked in, and with receivables "Kestrel Developers owes ₹18.7 L across 3 bookings; Vikrant Saluja's invoice is 18 days overdue." and "3 developer registrations expire this week.") and **Team follow-ups today**. No personal "Up next" card.
  - **Sales:** the cards below (Up next visit, Waiting for a reply, Active value), then the inbox and Due today.
  - **Pre-sales:** **Up next · call** ✅ — the buyer who has waited longest for a reply (or, with nobody waiting, the newest unqualified lead): "Call Pooja · 2 BHK in HSR Layout · waiting 5m" with **Message** and **Call now** (opens the call screen); **Waiting for a reply**; and **Your queue** (open leads, "2 to qualify · 0 ready for Sales"). Then the inbox and Due today.
- **Up next card** ✅ (Sales): the soonest open visit (planned, on the way or checked in) among the viewer's visits (§3.12), with "+N more visits booked". With none it says "No visits booked". **Directions** shows a toast ("Directions to … sent to your phone") 🎭. **Message** opens that lead's chat ✅.
- **Waiting for a reply** ✅ (live): buyers with unread messages among the viewer's open leads, "N over 15 min · reply first" (or "All within 15 min" / "Every buyer has heard back"), and the avatars of the three who have waited longest. On phones the day cards are compact (no avatars or bars) so the inbox starts higher. **Active value** ✅ = sum of budget midpoints of the leads the viewer sees (Priya with seed data: ₹11.9 Cr across 5 open leads), with the open-lead count (closed leads excluded).
- **Lead inbox** ✅: filter *All / Hot / Warm / New*, a **source** dropdown (All sources + every source in the viewer's leads), plus search by name, requirement or locality. Subtitle counts conversations awaiting a reply. Each row: avatar (green dot if online), name, time since the last message, requirement · budget, last message, unread count, then the intent tag and **at most one flag**, the most urgent: green **Won** / grey **Lost** on closed leads, else red **Overdue** (unread for more than 15 min). After them, in plain grey text: the owner for Managers and the Owner ("Priya N.", or **Unassigned** in amber) and "via <source>". Tapping a row opens the chat and **marks it read** ✅. A buyer's reply during the demo (M14 launch broadcasts) moves the lead to the top with 1 unread, the reply as its preview and "0m". Without a filter or search the inbox shows the **first 12 rows** and **Show all N conversations**; any filter or search lists every match. Empty state when nothing matches.
- **Due today** ✅: up to 4 remaining follow-ups (time, title, lead). Tapping one opens that lead's chat (Follow-ups if the lead is no longer visible); **Open follow-ups** goes to Follow-ups.
- Desktop: inbox beside the digest (team home) and Due today. Tablet/phone: stacked; on the team home the digest comes before the inbox.

### 3.2 Lead conversation (WhatsApp chat + lead panel)
**Chat column**
- Header: **Back** returns to the screen the chat was opened from (Today, Pipeline, Follow-ups or Calls) ✅, avatar, status line, **Details** (phones only, opens the lead panel as a bottom sheet ✅), **Call** opens the call screen ✅. Status line comes from lead data: "Last message <time> ago" (the buyer's latest message) or "New lead · <phone>" for leads added in the demo. The header shows no online or last-seen status, because WhatsApp's Business API doesn't provide either. Each message the team sends shows a tick, and launch messages show delivered and read ticks (§3.19).
- **Brief strip:** requirement · budget · move-in timing (per lead).
- **Action bar** above the thread, on every screen size (three equal buttons on tablet and phone):
  - **Share homes** ✅ opens the Share dialog (§3.4) for this lead.
  - **Plan visit** ✅ (people who run visits) opens Schedule visit (below); once booked it reads "Visit booked" (plus the time, e.g. "· Today · 11:30 AM", on desktop) and opens Visits. **Pre-sales** get **Hand to Sales** ✅ here instead, on leads they own while *Separate pre-sales team* is on.
  - **Remind me** ✅ opens the reminder dialog (§3.5) for this buyer.
- Messages 🎭: the lead's own opening enquiry, an **Automatic** reply (tagged, "thanks for reaching out to Better Days Realty!"), a scripted reply with the lead's budget, the property card sent then (the best match from the seed listings, so adding listings later doesn't rewrite history), and the lead's latest message. **Times count back from now**: the latest message is the lead's "minutes ago" before now; the earlier messages are about 4 days before that for leads past *New lead* and about 20 minutes before for new ones, with day labels ("Fri, 16 Oct", "Yesterday", "Today") where the day changes. Homes shared in the demo appear as a message with the listing cards and, a few seconds later, **"Seen"** 🎭 next to the time. Leads added in the demo start with an empty chat and a "Lead captured just now" note. Leads that **arrived from a source in the demo** show only the buyer's enquiry ("Just now").
- Quick replies ✅ fill the composer: "Suggest a time", "Share location" (or "Send a welcome message" for added and newly arrived leads), plus a **Templates** chip. The **+** menu offers *Property* (fills the best match's details) and *Location*.
- **AI drafts** ✅ 🎭 (sparkle button in the composer): three reply drafts for the buyer's last message: English, Hindi, Kannada + English. Picking one only fills the composer; nothing is sent automatically.
- **Templates** ✅: a sheet with Welcome / Share shortlist / Visit reminder / Follow-up / New launch (Marketing, M14). Fields (buyer name, property, day and time, your name) are prefilled and editable, with a live preview; **Send template** posts it tagged "Template · <name>".
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
- **Ownership history** ✅ folded under the card as "Ownership history · N" (tap to open): each change with new owner, reason, previous owner, who did it and when.
- Then, in this order: stage name, budget, requirement, intent tag; the **AI score** 🎭: 0–100 with Hot / Warm / Cool and the reasons ("budget confirmed · visit planned · replied 2 min ago"; "replied just now" under a minute); the **stage track** ✅ (New / Qualified / Visit / Offer); AI suggestions from the chat (when there are any); the Deal panel (when there is one); **Matches**; the **buyer brief**; **Tags**.
- **AI suggestions** (per lead): when AI has suggestions from the chat, a "Suggested from the chat" box lists them (budget, looking for, move-in) with **Accept** (applies them to the brief and logs it) or **Dismiss**.
- **Buyer brief** (per lead): purpose (Live-in / Investment), localities, move-in, must-have, phone, source. **Edit** ✅ opens a form with structured fields: Looking for (2/3/4 BHK, Villa, Plot), Purpose, budget from/up to in ₹ Cr (must be max ≥ min, otherwise Save is disabled with an error), localities (comma separated; the first is the main one), Move-in, Must-haves. Saving rebuilds the requirement and budget text everywhere (inbox, pipeline, totals) and adds a timeline entry. On phones, Edit closes the sheet and opens the form. **Phone numbers are masked** (`+91 98XXX XX018`) for Sales and Pre-sales; Managers and the Owner see full numbers.
- **Developer registrations · N** ✅ (M14, below the Deal panel; §3.18): each registration's project and developer, status chip, "Valid until Fri, 23 Oct · 3 days left" with a thin meter, who registered it ("Registered by Kavya R. · lead now with Aditya R."), how and when, masked PAN (**Show** for people who see full numbers), proof; **Renew**, **Mark disputed**, **Resolve** (Owner, Manager); **Register with a developer** for anyone who can see the lead.
- **Deal** panel ✅ (leads in Negotiation, closed leads, or any lead with a recorded offer), above the buyer brief: asking price; the **offer history**, newest first ("Buyer offered ₹3.2 Cr · Sun, 11 Oct", "Owner countered ₹3.35 Cr · Fri, 9 Oct"; blue dot for the buyer, amber for the owner); an amber **"No new offer in N days"** note when the latest offer is more than 7 days old (open deals only); agreed price; token with the day it was paid ("₹5 L · paid today"); **Agreement by** (when set); commission split; and a **document checklist** (Buyer KYC, Token receipt, Sale agreement; tap to tick, logged on the timeline). **Edit** / **Add offer** opens the deal dialog; **Mark lost** / **Mark won** as on the pipeline. Closed leads show "Won" or "Lost · reason", the stage label reads Won/Lost, and **Reopen deal** is offered.
- **Tags** ✅: applied tags as removable chips; **+ Tag** shows suggestions (First-time buyer, Loan needed, NRI, Investor, Urgent, Price sensitive, Repeat client) and a custom-tag field (Enter to add).
- **Matches · N** ✅: the best listing as a card with its reasons ("Indiranagar", "3 BHK", "In budget"; weaker ones like "6% over budget" or "On hold" in amber), then up to 3 more with their reasons. Listings already sent show **Sent** or **Seen**. With none: "No listing fits this brief yet." Matching (`matchesForLead` in `src/data/inventory.ts`): one of the buyer's localities +3, BHK or villa as asked +2 (any apartment +1 if no size was given), in budget +3 (up to 10% over +1), on hold −1; sold listings never match; a match needs 4 or more; equal scores put the price closest to the middle of the buyer's budget first. Editing the brief changes the matches straight away.
- (Share homes and Plan visit live in the chat's action bar, above.) **Schedule visit** ✅ opens a dialog: property (matched one preselected), day (Today … 6 days ahead; defaults to the coming Saturday), time slot, and agent (the lead owner; only Managers/Owner can change it). Booking posts a WhatsApp confirmation in the chat ("Visit confirmed: The Courtyard House, Indiranagar, Tomorrow at 3:00 PM…") 🎭, moves the lead to *Visit planned* (never backwards), and logs it. When a visit is booked the button reads "Visit booked · Tomorrow · 3:00 PM" and opens Visits.

*Timeline tab* ✅: everything on the lead, newest first. Demo actions are logged as they happen (with who did it): messages sent, assignments, stage moves, visits booked, calls saved, notes, tag changes, brief edits, merged enquiries. Below them, events implied by the seed data: the buyer's latest message, seeded call recordings, the seeded visit, "Assigned to … by routing", and "First enquiry via <source>" last. **Export chat** 🎭 sits above the timeline for people with *Export data* (Owner): a dialog picks text or spreadsheet, and whether to include private team notes. Nothing is downloaded in the demo; it shows "Chat export ready · no file is created" and logs "Exported chat with <name>" to the audit log.

*Notes tab* ✅: private team notes (not sent to the buyer). Add with the text box; each note shows author and time.

### 3.3 Pipeline
- Stages: **New lead → Qualified → Visit planned → Negotiation**, plus a **Closed** column for won and lost deals.
- Summary: Open deals ✅ (with "N won · N lost"), Visits planned ✅ (open leads in *Visit planned*), Likely commission ✅ = sum of budget × 2% fee × stage close probability (10% / 30% / 60% / 80%), over the open leads the viewer sees. Closed leads are left out of active value and likely commission everywhere.
- **Hot leads only** filter toggle ✅.
- Deal card: person (tap → chat; on desktop the whole card opens the chat), the owner first for Managers/Owner ("Priya N. · 3 BHK in Indiranagar", or "Unassigned"), budget (or the buyer's latest **Offer** with its date, e.g. "₹3.2 Cr · Offer · Sun, 11 Oct") with the intent tag beside it, and an amber **"No new offer in N days"** flag when the latest offer is more than 7 days old.
  - **Desktop (> 1100 px): drag and drop only.** Cards are compact (no last message, no buttons). Drag a card onto another stage to move it (forwards or back). The Closed column always shows two dashed drop targets, **Won** (opens the deal dialog) and **Lost** (asks for a reason), "Drop a deal here"; while a card is dragged they turn green and red. They work for a deal at any stage. Dragging a closed card onto a stage reopens it there. Keyboard users get the move buttons when a card is focused with the keyboard; the lead panel also has Mark won / Mark lost / Reopen deal.
  - **Tablet and phone (touch, no dragging):** cards also show the last WhatsApp message, a **back** arrow (moves one stage back) and **Move to <next stage>** ✅; cards in Negotiation show **Lost** and **Won** instead of Move, and closed cards **Reopen**.
  - **Won** on a lead with a developer registration (M14) also offers **New-launch booking at <project>** (off by default) and **Unit**; ticked, saving adds a booking to Brokerage (booked today, agreement = agreed price; e.g. "Waiting for 15% payment"), marks the registration **Booked**, notifies the Owner and logs "Booked Kestrel Heights T1-1404 · ₹2.65 Cr". A lapsed registration shows "Registration lapsed on <date>. The developer may refuse brokerage."
  - **Won** opens the deal dialog (the same dialog as **Edit** on the Deal panel): asking price; **Offers** (the history, newest first, each removable with ×; then *Log an offer*: Buyer offer / Owner counter, amount in ₹ Cr, date from Today back to 14 days ago, **Add**; an amount typed but not added is saved too, and an amount of 0 is refused); **agreed price (required to win; prefilled with the latest buyer offer)**; **Agreement by** (Not set, or Today up to 30 days ahead); token amount (₹ L) and, once entered, **Token paid on** (Today back to 14 days ago); and the **commission split** (people + %, must add up to 100%; defaults to the owner 100%, or 90/10 with the Pre-sales person who handed the lead over). Saving moves the card to Closed ("Won at ₹3.2 Cr") and the commission counts on the leaderboard (§3.14).
  - **Lost** asks for a reason (Bought through another broker, Budget too low, Stopped responding, Loan not approved, Changed plans, Other); the card moves to Closed with the reason.
  - Closed cards have **Reopen** (tablet/phone), which returns the lead to its stage.
  - Every move, offer ("Owner countered ₹3.3 Cr (dated Yesterday)"), document and closure is written to the lead's timeline. Stages and deals are saved locally.
- Desktop: 5 columns (Closed slightly narrower), every move by **drag and drop**; the subtitle says how ("Drag a card to move it to another stage. Drop it on Closed to mark the deal won or lost."). Tablet: 2-column grid, Closed full width. Phone: **stage tabs** with counts (incl. Closed), opening on the first stage that has deals.

### 3.4 Properties / inventory (M11)
- Header: "6 available · 1 on hold · 1 sold" (live) and **Add property** (Owner, Managers and Sales; not Pre-sales).
- Filters ✅: locality chips (All + every locality that has a listing) and availability (All / Available / On hold / Sold).
- Listing card: photo (or a placeholder for listings added in the demo), availability tag, **Save** bookmark ✅, locality, name, BHK (or "4 BHK villa"), sq ft, **Listed by** (listing agent), **Owner** name and number, price, **Edit** (same people as Add) and **Share** (disabled when sold).
- **Owner's number** is shown in full to Managers, the Owner and that listing's agent; everyone else sees it masked (`+91 99XXX XX244`). When someone who can't see it edits the listing, the number field is locked.
- **Add / Edit property** ✅: name, locality (Indiranagar, Whitefield, HSR Layout, Koramangala), bedrooms (1–5 BHK), type (Apartment / Villa), asking price (₹ Cr), carpet area (sq ft), availability, listing agent, owner's name and 10-digit mobile. Errors show on Save (name, price, area, owner name, mobile). Changes show up in matches immediately. Added listings get the locality's centre as their address (used for visit check-ins). **TODO:** this is wrong for real visits; the address must be a confirmed pin (§8.18).
- **Share dialog** ✅ (from a listing, or **Share homes** on a lead):
  - From a listing it first asks **which lead**: open leads, searchable, best fit first, each with the reasons this listing fits them (or "Not a close match").
  - Then: the lead's **matches** with reasons and Sent/Seen tags, tickable (the top 3 available are pre-ticked when opened from a lead; the listing itself when opened from a listing), **Show all homes** to pick any unsold listing, and a live **WhatsApp preview** ("Hi Ananya, here are 2 homes that match your brief: … Tell me which ones you'd like to visit.") with the listing cards.
  - Outside WhatsApp's 24-hour window the preview says it goes as the **"Share shortlist" template** and is tagged that way.
  - **Send** posts it into the chat, logs it on the timeline, records Sent per listing, and flips to **Seen** about 4 seconds later 🎭.

### 3.5 Follow-ups
- Header shows today's date ✅ and a progress ring (done/total) ✅.
- Today's seeded tasks for the leads the viewer sees (8 in total; e.g. 2 for Priya Nair), each with a time, lead avatar, title, note and action type, **in time order**.
- Tick to complete ✅ (saved; done tasks are struck through and faded).
- Task action: **Call** opens the call screen ✅. **WhatsApp / Send details** opens the chat ✅. Tapping the title also opens the chat.
- **Add reminder** ✅ opens the **reminder dialog** with a **Buyer** picker (open leads). From a chat, **Remind me** opens it for that buyer. Fields: quick picks (Call back → Call, Send more options → Send details, Check their decision, Confirm the visit → WhatsApp), **What to do** (editable), **Day** (Today … 7 days ahead), **Time** (every half hour 9:00 AM–8:30 PM; defaults to the next half hour at least 30 min away, or tomorrow 10:00 AM after hours) and **How** (WhatsApp / Call / Send details). **Set reminder** saves it, shows "Reminder set · Thu, 22 Oct at 4:00 PM" and logs "Follow-up set: …" on the lead's timeline.
- Reminders for today join today's list (in time order, counted in the ring and badges); later ones are listed under **Coming up** with their day.
- "This week" panel: bar chart 🧱 with today's weekday highlighted ✅, the 82% figure 🧱 and "12% ahead of last week" 🧱. Shown below the list on tablet/phone.
- Empty state when everything is done ✅.

### 3.6 Calls & recordings
- Stats: calls this week 18 🧱, answer rate 72% 🧱, recorded count ✅. The first two are demo numbers; in the product they come from the telephony provider's call logs (§8.15).
- Recording list: play/pause toggle (visual only 🎭, moving playhead; in the product it plays the recording file the provider stores, §8.15), waveform, duration, note. Calls saved in the demo get the note "Saved from the call screen" and are logged on the lead's timeline ("Call recorded (m:ss)"). There is no AI call summary: it depends on call recordings, which need a telephony provider (see §8.15). Search by buyer ✅. Tapping a person opens the chat.
- **New call** opens the lead picker ✅ (search by name, area or budget; a bottom sheet on phones) and then the call screen.
- **Call screen** 🎭: "Calling…" (button reads **Cancel**; Escape also cancels while dialling, but never during or after a call) → connected after 1.2 s, live timer ✅, REC badge, Mute / Speaker / Record toggles. **End call** shows the duration and recording status, then **Save recording** adds it to the top of the list ("Just now") and shows a toast ✅ (saved locally). If recording was turned off, **Done** closes without saving. Full screen on phones.
- Copy: "Secure internet call", "Your personal number stays private", and a consent reminder about recording.

### 3.7 Add lead (quick capture)
- Opens from **+** (phone top bar) or **Add lead** in the sidebar (desktop/tablet, on every screen).
- **Duplicate check** ✅: once 10 digits are typed, the number is looked up across **all** leads in the company. If found, a yellow alert names the existing lead (requirement, budget, owner; "(another team)" if the viewer can't see it) with **Open lead** (only if visible) and **Merge enquiry** (adds the new enquiry as a note and timeline entry on the existing lead; no new lead; success screen "Enquiry merged"). The submit button becomes "Add as a separate lead anyway".
- Fields: Full name\*, WhatsApp number\* (+91, exactly 10 digits), Looking for (2 BHK / 3 BHK / 4 BHK / Villa / Plot), Preferred area (defaults to "Bengaluru"). Managers and the Owner also get **Assign to**: *Auto* (company routing, §3.10) or a named person with their open-lead count.
- **Who owns the new lead:** Sales and Pre-sales own what they add. For Managers/Owner, *Auto* routes it: to the Pre-sales person with fewest open leads when *Separate pre-sales team* is on; otherwise to Sales, by locality team (if routing is "By locality" and the area matches a team) or fewest open leads.
- Saving creates a lead at the top of the inbox ✅: source "Quick capture", intent New, stage New lead, budget "Budget to qualify" (counts as ₹0 in totals), 1 unread, phone stored, and an ownership-history entry. Success screen says where it went: "now in your inbox", "assigned to <name>" or "in the unassigned queue".
- **Paste a message** ✅ (M14, §8.17.4; Add lead's second mode, **Type it in · Paste a message**): Bayana can't read a broker's own WhatsApp groups, so agents paste (or share, on phones) a forwarded requirement. Paste mode has the message box ("Paste a message forwarded from a broker group"), four sample chips, **Group** (HSR Brokers Network / Whitefield Property Connect / Bengaluru Realty Partners / Other) and **Read message**.
  - **Reading** 🎭 (`parseGroupMessage` in `ai.ts`; rules, not a model): the mobile (+91, 0 and spaces allowed), the name right before it (after "Client:", "Contact" or "Call"), BHK or villa, localities in the order mentioned (also "HSR", "Kora", "WF"), the budget ("1.8–2.1 Cr", "90 L") and must-haves (OC received, loan pre-approved, near metro, east facing, NRI, gated, ready to move). The form then shows name, number, looking for, area, **budget** and **must-haves**, each marked **AI · Suggested** until edited or **Confirm all**; **Paste another** starts over.
  - **Number belongs to: The buyer · The broker who posted it**, pre-picked as the broker on "brokers … call", "Properties" or "Estates"; the name becomes "Client of Manjunath (MG Estates)" and the lead is tagged **Co-broking**.
  - Text that reads like a listing ("available", "resale", "for sale") shows "This looks like a property for sale, not a buyer's requirement." with **Paste another** or **It's a buyer, continue**.
  - Saving: the duplicate check (above) runs on the number found (sample 2 is Farhan Qureshi's number: **Merge enquiry** works); ownership rules as above; source **Broker groups**; the original message becomes a team note with numbers masked ("…Arnav Sethi 98XXX XX730"); timeline "Captured from WhatsApp group HSR Brokers Network".
  - Samples: (1) "*URGENT requirement* 3 BHK in HSR / Koramangala, budget 1.8–2.1 Cr, OC received only. Client: Arnav Sethi 98451 62730. Loan pre-approved." (2) "Need 2 BHK Indiranagar near metro, 1.5–1.7 Cr. Contact Farhan 97390 22814" (3) "Client requirement: 4 BHK villa Whitefield, 3.5–4 Cr, NRI visiting next week. Brokers with options call Manjunath 99000 81234 (MG Estates)" (4) "Resale available: 2 BHK Indiranagar, 1,150 sq ft, ₹1.65 Cr, east facing. Call 98860 44120".

### 3.8 Team, roles and visibility (M1)
- **Roles** (permission bundles; one person can hold several): **Owner**, **Manager**, **Sales**, **Pre-sales**. Permissions: see all leads · see team's leads · assign/reassign · see full phone numbers · invite/deactivate people · change settings · view reports · export · hand leads to Sales · add and edit properties (Owner, Manager, Sales) · run and track property visits (Owner, Manager, Sales; so Pre-sales have no Visits screen) · see property owners' numbers (Owner, Manager) · see the audit log (Owner) · see brokerage receivables (Owner, Manager) · record invoices and payments (Owner) · create and send launch broadcasts (Owner, Manager) (table in §3.10).
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
  - One row per source: 99acres, MagicBricks, Housing (Portal), Facebook ads (Ads), WhatsApp (Messaging), Walk-in, Referral, Quick capture (Offline, "Manual entry"), Broker groups (Messaging, "Manual capture", 7 a week 🧱, ₹0; M14, §3.7).
  - Each row: status (Connected / Not connected / Manual entry), leads this week 🧱, first-reply time 🧱, **cost per lead** (₹, editable by the Owner, totals update live), **Feeds team** (used by "By source" routing; editable by the Owner), **Disconnect/Connect** 🎭 (online sources, Owner), **Simulate** (online sources while connected).
  - **Simulate new lead** in the header rotates through connected sources.
- **Simulated arrival** ✅ (header button, a row's Simulate, or account menu → *Simulate incoming lead*, available to every role):
  - The next buyer from a pool of 6 (Meera Iyer, Arvind Rao, Sunita Reddy, Karan Malhotra, Fatima Sheikh, Harish Gowda) arrives from that source with 1 unread message, budget "to qualify", an automatic reply (if on), and an owner from the company routing rule (§3.10), recorded in ownership history and the timeline ("New enquiry via 99acres · routed to …").
  - A **New lead banner** slides in (top right on desktop; under the top bar on phones) for 7 s: source, buyer, need, budget, owner or "Waiting in the unassigned queue", **Dismiss** and **Reply now** (only if the viewer can see the lead; opens the chat).
  - With no connected source, a toast says to connect one.

### 3.12 Visits and field check-ins (M6)
- **Visits screen** (people who run visits: Owner, Managers, Sales; not Pre-sales): "Your visits" (Sales/Pre-sales) or "Team visits" (Manager/Owner, for the leads they can see). Stat strip: visits today (completed count), verified check-ins today, refused attempts today (and yesterday's no-shows). Sections: **Today**, **Upcoming**, **Earlier**.
- **Each visit:** time and day, buyer (tap → chat), property and locality, agent, status (Planned / On the way / Checked in / Completed / No-show), each recorded step (Left office · time, or "Left 1.2 km from Whitefield office"; ✅ Verified check-in · time · distance; ⚠️ Check-in refused · time · distance or accuracy; Checked out), the outcome, and the result of the last tap.
- **Agent flow** (only the visit's agent, only on the day):
  - **Left office** is always recorded, with a note if the reading was more than the radius from the agent's office.
  - **Check in** is allowed straight from Planned or after Left office. It is **refused** when the reading is more than the radius (default 200 m) from the property, or less accurate than 100 m, with a message: "You're 1.4 km from The Courtyard House. Move closer to check in." The refused attempt is kept on the log.
  - **Check out** (only after a verified check-in) opens a **required outcome form** that can't be dismissed: Liked it / Wants another visit / Not interested, buyer feedback, next step.
  - Every step goes on the lead's timeline.
- **Phone location · Demo** strip (one slim dashed line, not a card): At office / Near client (~60 m) / Far away (~1.4 km) give scripted readings 🎭. **This device** uses the browser's real location (asks permission once) ✅. One line states the limits: "Read once when you tap · no live tracking · refused beyond 200 m".
- **Seed visits:** Ananya (Priya, today 11:30, planned), Deepak (Ritu, today 4:00 PM, planned), Lavanya (Manoj, Palm Grove Villas, today 9:30, completed with outcome), Rohan & Meera (Vivek, today 10:00, checked in after one refused attempt), Nisha (Rohit, tomorrow 10:30), Vikram (Sneha, yesterday, no-show).

### 3.13 Attendance & leave (M7, M8)
- **Who:** everyone except the Owner (the Owner sees the register only). Tabs: **My day** and **Leave** (anyone tracked), **Register** and **Requests** (Manager: their team; Owner: everyone).
- **My day:**
  - Phone location · Demo strip (At office / Far away / This device).
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
- **Manager — "<Team> team performance"; Owner — "Performance & insights" (with a team filter).** (The daily summary and AI weekly digest are on the team home, §3.1, not repeated here.)
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
  - a deal won → the owner's manager and the Owner;
  - (M14) a buyer replied to a launch broadcast → the lead's owner ("Nisha Kulkarni replied to the Banyan Bay Phase 2 launch: 'Yes, send details'");
  - (M14) a developer's payment recorded → the booking's agent ("Kestrel Developers paid the brokerage for … Your share goes out with this month's payout."); a booking disputed → the Owner and the agent's manager. Seed: Arjun has "Halcyon Habitats: invoice BDR/26-27/014 for Rajiv Menezes is 43 days overdue." (opens Brokerage).
- **Audit log** ✅ (Owner only; nav **Audit log**): newest first, who (avatar, short name), when, type and what. Types with counts as filter chips: Reassignments, Team (invite, deactivate with lead count, reactivate), Settings (pre-sales switch, routing, radius, work hours, auto-reply on/off/message, lead-source cost/team/connection), Properties (added; edited with what changed: price, availability, listing agent, owner contact), Deals (won with price, lost with reason, reopened), Channel partner (margin money, invoice raised, payment recorded with amount and invoice number, step undone, dispute marked or resolved), Exports (incl. brokerage bookings). Repeated edits of the same setting by the same person update one entry, so typing a cost doesn't flood the log.
- **Export leads** and **Export log** ✅ download CSV files in the browser (`daira-leads.csv`: name, phone, source, owner, stage or Won/Lost, budget, looking for, localities; `daira-audit-log.csv`) and are themselves logged.
- Not built: logging each time someone views a full phone number (Managers and the Owner always see full numbers in this prototype); editing permissions (the table is read-only, so there are no permission changes to log).

### 3.16 Guided demo (presenter mode)
- **Start guided demo** (account menu) opens a dark panel bottom right (above the tab bar on phones) for whoever is presenting to a client. It can be minimised to a "Demo · step N of 12" pill or ended at any time, and each step has **Skip**.
- Each step shows what to point out and one button that does it with the real demo actions (so everything it does also lands on timelines, notifications, the audit log and reports). After it runs, the button becomes **Next step**.
  1. **The Owner's morning**: View as the Owner, opens the team home (daily summary tiles and the AI digest).
  2. **A buyer enquires on 99acres**: a 99acres enquiry arrives (the next simulated buyer; Meera Iyer on fresh data), routed to Pre-sales (Lakshmi Narayan, who has the fewest open leads) with the auto-reply, and its chat opens.
  3. **Auto-qualification and the AI brief**: waits ("Waiting for the buyer's answers…") until all questions are answered, then **Accept the AI brief**.
  4. **<Pre-sales>'s call queue**: View as the Pre-sales person who got the lead; their Today shows "Up next · call — Call Meera" with Call now and Message.
  5. **Pre-sales hands over to Sales**: as the telecaller, hands the lead to the first active salesperson in the lead's locality team (Sneha P. for HSR Layout; Priya N. if there's no team), then carries on as that salesperson with the chat open.
  6. **Share a match and book the visit**: shares the best match on WhatsApp and books a visit today at 4:00 PM with that salesperson, confirmed in the chat.
  7. **A follow-up in four taps**: Remind me → Call back on the coming Thursday at 11:00 AM (a week today on Thursdays); opens Follow-ups, where it is under Coming up.
  8. **A check-in from the wrong place is refused**: opens Visits and checks in 1.4 km away (refused, with a warning toast; their manager and the Owner are notified).
  9. **A verified check-in at the property**.
  10. **Visit outcome**: checks out with "Liked it" and a next step.
  11. **Negotiate and win**: moves to Negotiation, records the deal (asking = listing price; a buyer offer at 94% and the owner's counter at 98%, both today; agreed = the counter; ₹5 L token paid today; agreement in 14 days; KYC and token receipt done; 100% to the salesperson), marks it won, opens Pipeline.
  12. **The leaderboard moves**: back to the Owner on Performance; the salesperson's commission this month rises by agreed price × 2%. A toast says "Sneha P.: +₹2.9 L commission this month", and their leaderboard row scrolls into view and pulses green for a few seconds.
- **Bonus: money developers owe you** ✅ (M14, on the finish card; the guide still counts 12 steps): "Developers pay brokerage late. Arjun sees ₹42 L pending and 3 overdue, and chases the most overdue invoice in one tap…" → **Chase the most overdue invoice** views as the Owner, opens Brokerage on Overdue with Rajiv Menezes' booking open and sends the Gentle reminder (toast "Reminder sent to Rakesh Iyengar (Halcyon Habitats)"; the scripted reply follows in about 4 s).
- The finish card suggests resetting demo data before the next client. The guide's place in the script is not saved; reloading the page ends it.

### 3.17 Brokerage receivables (M14 · channel partner, §8.17.1)
What developers owe the firm for new-launch bookings it sold as their channel partner. Brokerage = agreement value × the developer's %; headline figures are **before GST and TDS**. Seed in §4.
- **Brokerage screen** ✅ (nav **Brokerage**, first in Manage; `viewReceivables`: Owner every booking, Managers their team's agents' bookings; Sales and Pre-sales never see it). Title "Brokerage", subtitle "What developers owe Better Days Realty · brokerage before GST and TDS", **Export CSV** (`exportData`; `bayana-brokerage.csv`, audited).
  - **Stat strip** (each tappable, sets the filter): **Pending** ₹42 L · 8 bookings · **Overdue** ₹15.4 L · 3 bookings (red) · **Ready to invoice** ₹5.7 L · 1 booking · **Received · last 30 days** ₹3.5 L · 1 booking. Lakh figures drop a trailing ".0" (`formatLakh`).
  - **Charts** (`BarList`, with a Chart · Table toggle): **Pending by developer**, largest first (Kestrel ₹18.7 L, Banyan Bay ₹12.4 L, Larkspur ₹6 L, Halcyon ₹4.9 L) and **Age since booking** in order (0–30 ₹16.6 L, 31–60 ₹6.2 L, 61–90 ₹10.6 L, 90+ ₹8.6 L; "N bookings" under each). Tapping a developer bar sets the developer filter; an age bar adds a removable "Booked 61–90 days ago" filter.
  - **Filters:** chips All · Overdue · Ready to invoice · Awaiting payment (waiting for the buyer's % or invoiced within terms) · Disputed · Paid, with counts, and a developer dropdown. Order: most overdue first, then disputed, ready to invoice, due soonest, waiting; in All, **Paid · N** is folded at the end.
  - **Rows** (a table on desktop; cards on tablet and phone): buyer and unit, developer, agent, agreement, brokerage ("₹4.86 L · 3% of ₹1.62 Cr"), a 4-dot milestone track (booked → margin money → invoice → payment), the status (*Waiting for 10% payment* · *Ready to invoice* · *Due in N days* · **Overdue N days** · **Disputed** · *Paid*) and the next step: **Mark margin paid** / **Raise invoice** (Owner) or **Send reminder** (Owner, Manager; primary when overdue). Full-width 44 px buttons on phones.
- **Booking detail** ✅ (sheet on phones): milestones with dates, **Brokerage @ %**, **GST @ 18%** (added), **TDS @ 2%** (deducted), **Net receivable** in rupees (Rajiv Menezes: ₹4,86,000 · + ₹87,480 · −₹9,720 · ₹5,63,760), the invoice chip "BDR/26-27/014 · PDF (demo)" 🎭, reminder history with replies, and actions: **Mark margin paid** · **Raise invoice** · **Record payment** · **Mark disputed** / **Resolve** · **Undo last step** (all Owner, `manageReceivables`) and **Send reminder** (Owner, Manager, once invoiced). Footnote: "GST 18% and TDS 2% are demo settings. Confirm with your CA."
- **Recording** ✅ (dates Today … 14 days ago): margin money paid; **Raise invoice** with the next number prefilled ("BDR/26-27/025"; financial year from today) and the developer's terms; **Record payment** with the amount fixed to the net receivable, optional UTR and "TDS certificate received" (audited "Recorded payment ₹5,63,760 from Halcyon Habitats (BDR/26-27/014)"; the agent is notified); **Amount differs? Mark disputed** for short payments; **Mark disputed** with a reason (Developer says another CP registered this buyer first / Developer disputes the agreement value / Amount differs / Other; notifies the Owner and the agent's manager).
- **Send reminder** ✅ 🎭: tone **Gentle · Firm** and an editable WhatsApp message to the developer's CP manager (Gentle: "Hi Rakesh, a gentle reminder from Better Days Realty. Our invoice BDR/26-27/014 for ₹5,63,760 (Rajiv Menezes, Halcyon Grove B-1204) was raised on <date> and is 43 days past your 45-day terms. Could you share the payment date? Thanks, Arjun Khanna"; Firm: "…is 43 days overdue. Please release it this week, or tell us what's pending from our side."). **Send on WhatsApp** → toast "Reminder sent to Rakesh Iyengar (Halcyon Habitats)"; about 4 s later the history shows the scripted reply "Noted. Checking with accounts, will confirm the date by Friday."
- Rates (GST 18%, TDS 2%) are constants in `src/data/channelPartner.ts`.

### 3.18 New launches and developer registrations (M14, §8.17.2)
A developer pays CP brokerage only if the firm's registration of the buyer hasn't lapsed and no other CP registered them first. Bayana records registrations (it submits nothing to developers) and warns before they lapse. Time doesn't pass in the demo, so alerts come from the seed (§4).
- **New launches screen** ✅ (Work, everyone): "Developer projects you sell, and the buyers you've registered with them."
  - **Developer registrations:** chips All · Expiring · Lapsed · Disputed · Booked with counts (Owner: 9 · 3 · 1 · 1 · 0), soonest expiry first (lapsed ones lead), disputed and booked last. Each row: buyer (→ chat) with project and developer, "Registered by Kavya R. · lead now with Aditya R.", status (*Registered · N days left* · *Expiring · N days left* / *Expires tomorrow* (≤ 7 days, amber) · **Lapsed N days ago** · **Disputed** · *Booked*), "Until <date>" or the dispute reason, and **Renew**. Lead visibility (§3.8) applies; cards on tablet and phone.
  - **My bookings** (Sales and Pre-sales, who have no Brokerage screen): their own new-launch bookings as status words only, e.g. "Invoice raised · awaiting developer payment"; never brokerage %, amounts or tax. A payment recorded on one notifies the agent and opens here.
- **Register with a developer** ✅ (lead panel; a sheet on phones): project, buyer and mobile (read-only, masked as usual), **PAN** (optional, "Some developers ask for it"; "PAN should look like ABCDE1234F" blocks Save), how you registered (Developer's CP portal / Email to CP manager / WhatsApp to CP manager), registered on (Today … 30 days ago), developer's reference, **Add screenshot** 🎭 ("registration-proof.png · demo"), and the note "Bayana keeps your proof and reminds you before it lapses. It doesn't submit anything to the developer." Saved entries show "Recorded by Priya N. · Tue, 20 Oct, 2:14 PM"; PAN shows as "XXXXXX234K".
- **Conflict warning** ✅: the firm's active registrations with the same developer for the same phone number are checked, even on leads the viewer can't see: "Already registered with Kestrel Developers by Kavya R. on <date> · valid until <date>. The firm is already protected; registering again won't extend it and may confuse the developer's CP desk." The button becomes **Register anyway**; doing so notifies both people's managers and the Owner, is audited and is logged "Registered anyway … (already registered by Kavya R.)".
- **Renew** ✅ (new date, proof; restarts the developer's window, e.g. 45 days for Kestrel), **Mark disputed** ✅ (Another CP registered first / Developer has no record / Other; anyone who can see the lead), **Resolve** ✅ (Owner, Manager: "Developer accepted ours", or "Lost to another CP" → Lapsed). Each is on the lead's timeline (kind *registration*).

### 3.19 Launch broadcasts (M14, §8.17.3)
- **New launches → Launches** ✅ (the tab New launches opens on for people with `runLaunches`, Owner and Managers; others open on Registrations). Each launch card: project · phase, developer and area, configurations and prices, "Launches on Sat, 24 Oct · EOI ₹2 L · Possession Dec 2029 · RERA …", and **Draft** or **Sent**. Sent cards show Sent · Delivered · Read · Replied, the cost ("₹10.32 · 12 delivered"), who wasn't reached and buttons for each buyer who replied (→ chat). Drafts show "13 buyers match" and **Review and send** (`runLaunches`); without it, "N of your buyers match" and no New launch or Send.
- **New launch / Review and send** ✅ (`runLaunches`; full screen on phones with the button at the bottom), three steps:
  1. **Details:** project (or **New project…** with name, developer and locality), phase or tower, configurations (BHK + price from/to, **Add configuration**), launch day (Today … 30 days ahead), early-access EOI (₹ L), possession and **RERA number** (required: "Add the RERA number. It must appear in every launch message." blocks Next). **Save draft** keeps it as a Draft.
  2. **Audience:** open leads the viewer can see, matched on three on/off chips that update the count live ("13 buyers match"): **Locality** (one of the buyer's localities is the project's), **BHK** (a configured BHK; investment flats match any, villas never) and **Budget** (overlaps that configuration's band). Each row has a tick, the buyer, the owner and the reason ("HSR Layout · 2 BHK · ₹1.4–1.55 Cr fits ₹1.35–1.55 Cr"), and "Registered with Banyan Bay" where a registration applies. Note 🧱: "Only buyers who agreed to receive updates from Better Days Realty are included." Empty: "None of your team's buyers match. Turn a filter off to widen it."
  3. **Preview:** the WhatsApp bubble tagged **Marketing** for the first ticked buyer ("Hi Vikram, Banyan Bay Residences · Phase 2 by Banyan Bay Developers launches on Sat, 24 Oct off Sarjapur Road, HSR Layout. • 2 BHK · ₹1.35–1.55 Cr • 3 BHK · ₹1.85–2.1 Cr. Possession Dec 2029 · RERA PRM/KA/RERA/DEMO/0142. Early-access EOI ₹2 L (refundable). Want floor plans and a site visit? — Arjun, Better Days Realty"), buttons **Yes, send details** · **Not now**, "Reply STOP to opt out", and the cost "Marketing template · 13 × ₹0.86 = ₹11.18 (Meta's India rate, charged per delivered message)".
- **Send to N buyers** ✅ 🎭 asks to confirm, then each chat gets the message tagged "Template · New launch" with WhatsApp ticks and a text label: grey ✓ Sent → grey ✓✓ Delivered (~1.5 s) → blue ✓✓ Read (3–6 s); colours `--tick-sent` / `--tick-read`. Scripted for the seed draft: Omkar Jadhav "Not delivered · not on WhatsApp"; Vinay Prabhu, Tejas Patil and Bhavana Shenoy delivered but unread; replies at 6–8 s from Nisha Kulkarni ("Yes, send details"), Aman Khurana ("Any 3 BHK on a high floor, east facing? Is the EOI fully refundable?") and Asha Thomas ("Yes, send details"), which reach the inbox as buyer messages. Result: Delivered 12 · Read 9 · Replied 3 · ₹10.32. Other launches: about 80% read and the first quarter reply.
- Logged on each lead's timeline (kind *launch*: sent, each reply), replies notify the lead's owner, and the send is audited ("Sent Banyan Bay Residences · Phase 2 to 13 buyers · ₹11.18").

## 4. Seed data (`src/data/demo.ts`, `src/data/team.ts`, `src/data/sources.ts`)
- **Team (22, `team.ts`):** Owner Arjun Khanna; Indiranagar team (manager Neha Kapoor; Sales Priya Nair, Aditya Rao, Kavya Reddy *on leave*, Sameer Joshi, Divya Iyer); Whitefield (manager Rahul Menon; Sales Vivek Sharma, Ritu Bansal, Manoj Kumar, Ayesha Khan, Karthik Srinivas); HSR Layout (manager Farah Sheikh; Sales Sneha Pillai, Rohit Verma, Ananth Krishnan, Meghna Das, Tarun Gowda); central Pre-sales Kiran Patel, Lakshmi Narayan, Imran Ali.
- **Leads (46):** the 12 scripted leads below, which drive the story and top every inbox, plus a **wider book of 34 quieter leads** (`src/data/bookOfLeads.ts`) spread over the team so each salesperson has 2–5 open leads (Kavya, on leave, and Lakshmi, who gets the demo enquiry, have none; Imran has 2). The book has no unread messages, so escalations and "Waiting for a reply" come only from the scripted twelve. 6 of them have upcoming visits (tomorrow to 4 days ahead) and 3 are in negotiation with offers (one with a 10-day-old offer, so it shows the stale flag).

  The scripted twelve:

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

  Each lead also has a phone number, minutes since the last message, move-in timing, must-haves, opening enquiry and latest message. Ishita Banerjee last wrote 1 day ago (outside the 24-hour window). Vikram and Sanjay are marked Investment. The Owner's totals with all 46: active value ₹95.1 Cr, likely commission ₹74.9 L, 16 / 17 / 8 / 5 leads across New / Qualified / Visit planned / Negotiation. Priya: 5 open leads (₹11.9 Cr). Neha's Indiranagar team: 15 leads incl. 2 unassigned.
- **Properties (8, `inventory.ts`):** The Courtyard House (Indiranagar, 3 BHK, ₹2.65 Cr, Priya) · Windermere Residences (Whitefield, 4 BHK villa, ₹3.40 Cr, Vivek) · Lakeview Terraces (HSR Layout, 2 BHK, ₹1.48 Cr, Sneha) · Palm Grove Villas (Whitefield, 4 BHK villa, ₹4.20 Cr, Manoj) · Indigo Heights (Indiranagar, 2 BHK, ₹1.62 Cr, Aditya) · Maple Court (HSR Layout, 3 BHK, ₹1.95 Cr, Rohit) · Brookside Towers (Whitefield, 2 BHK, ₹1.12 Cr, **on hold**, Ritu) · Cedar Row (Indiranagar, 3 BHK, ₹3.10 Cr, **sold**, Kavya). Each has an owner name and number. Photos load from Unsplash, so the demo needs internet.
- **Deals (`deals.ts`):** Rohan & Meera (asking ₹3.4 Cr; buyer ₹3.1 Cr 14 days ago → owner ₹3.35 Cr 11 days ago → buyer ₹3.2 Cr 9 days ago, so the stale flag shows; split Vivek 100%) and Lavanya Subramaniam (asking ₹4.2 Cr, Palm Grove Villas; buyer ₹3.9 Cr 5 days ago → owner ₹4.1 Cr 3 days ago → buyer ₹4.0 Cr 2 days ago; agreement targeted in 7 days; split Manoj 100%), both with Buyer KYC received; plus three from the wider book (Shreya Menon / Indigo Heights, Gautam Bhandari / Windermere, Vinay Prabhu / Maple Court). No deals are closed at the start.
- **Notifications and audit (`notifications.ts`):** unread for Arjun (Vivek's refused check-in, Aditya's leave request; Rohit's request already read), Rahul (the refused check-in), Neha (Aditya's request), Farah (Rohit's request), Priya (Ishita routed to her) and Kiran (Pooja routed to her). Audit log: 5 earlier entries (radius set to 200 m, two reassignments, a 214-row export, Lakshmi invited).
- **Performance (`performance.ts`):** generated monthly figures and targets per person, response-time bands, lost reasons, per-source visits/deals, days-in-stage for stuck leads, property shares.
- **Leave (`leave.ts`):** Kavya (Casual, 3 days ago → tomorrow, approved, cover Sameer); Aditya (Casual, in 2–3 days, pending, 1 lead); Rohit (Sick, tomorrow, pending; he has a visit tomorrow). Allowances 8 / 6 / 15 and generated days already used.
- **Attendance (`attendance.ts`):** generated history for the last 10 working days; today's records (most people checked in, some late or in the field; Priya, Neha, Kiran and Sameer not yet, so the demo can do it); Kavya on leave; one pending correction from Sameer for 3 working days ago.
- **Visits and offices (`visits.ts`):** 6 seed visits (§3.12) plus 6 upcoming visits for the wider book (Sameer and Meghna tomorrow, Divya and Ritu in 2 days, Karthik in 3, Tarun in 4); offices in Indiranagar (HQ), Whitefield and HSR Layout with coordinates. Properties also carry coordinates.
- **Lead sources (9, `sources.ts`; Broker groups added for M14; its monthly figures in `performance.ts`)** with weekly leads, first-reply minutes, default cost per lead (₹450 / 400 / 350 / 180 / 0…) and default team; plus the pool of 6 buyers used for simulated arrivals.
- **Tasks (8)**, all for today, and **recordings (5)** linked to the leads above. Reminders set in the demo are added to the same list (with a day).
- **Channel partner (`channelPartner.ts`, M14):** developers Halcyon Habitats (CP manager Rakesh Iyengar; 3%, billable once the buyer paid 10%, pays within 45 days, registrations valid 30 days), Banyan Bay Developers (Deepa Raghunath; 2.5%, 10%, 60, 30), Kestrel Developers (Joseph D'Souza; 2%, 15%, 30, 45), Larkspur Estates (Nikhil Thakur; 2%, 20%, 30, 30); projects Halcyon Grove (Whitefield), Banyan Bay Residences (off Sarjapur Road, HSR Layout), Kestrel Heights (Koramangala), Larkspur Residences (Indiranagar), with fake RERA numbers ("PRM/KA/RERA/DEMO/0142"). **Bookings (10)**, days ago for booked · margin · invoiced · paid: Rajiv Menezes, Halcyon Grove B-1204, Vivek S., ₹1.62 Cr (120 · 95 · 88 /014) overdue 43 days · Sunaina Dutta, A-0703, Ayesha K., ₹1.18 Cr (60 · 45 · 40 /022 · 6) paid · Arun Pai, C-1502, Manoj K., ₹1.86 Cr (150 · 130 · 120 /009 · 60) paid · Prerna Chatterjee, Banyan Bay 2-1103, Sneha P., ₹1.48 Cr (110 · 100 · 95 /012) overdue 35 days · Manish Kothari, 3-0405, Rohit V., ₹1.96 Cr (30) waiting for 10% · Farida Lokhandwala, 1-0902, Meghna D., ₹1.52 Cr (75 · 60 · 58 /019) due in 2 days · Vikrant Saluja, Kestrel Heights T2-1801, Priya N., ₹3.42 Cr (70 · 50 · 48 /021) overdue 18 days · Ruchi Bhargava, T1-0602, Aditya R., ₹2.85 Cr (25 · 8) ready to invoice · Harpreet Sodhi, T2-2203, Ritu B., ₹3.10 Cr (45 · 30 · 28 /024) disputed "Developer says another CP registered this buyer first" · Neeraj Wadhwa, Larkspur Residences 3B, Divya I., ₹3.00 Cr (15) waiting for 20%. None is linked to a lead (they predate Bayana). By manager: Neha ₹18.5 L, Rahul ₹11.1 L, Farah ₹12.4 L, 1 overdue each. **Registrations (9)** (registered N days ago → today): Ananya Rao, Kestrel Heights, Priya N., 42 → expiring, 3 days · Ishita Banerjee, Larkspur Residences, Priya N., 10 → 20 days · Kunal Mehra, Larkspur Residences, Priya N., 12 → disputed (Another CP registered first) · Gaurav Bhatia, Kestrel Heights, Kavya R. (lead now Aditya R.), 30 → 15 days · Meenakshi Raghavan, Larkspur Residences, Sameer J., 32 → lapsed 2 days ago · Deepak Malhotra, Kestrel Heights, Ritu B., 20 → 25 days · Ishaan Malik, Halcyon Grove, Ayesha K., 5 → 25 days · Nisha Kulkarni, Banyan Bay Residences, Rohit V., 23 → expiring, 7 days · Vikram Shah, Banyan Bay Residences, Sneha P., 29 → expires tomorrow. Seed alerts: Priya (Ananya, 3 days), Rohit (Nisha, 7 days), Sneha and Farah (Vikram, tomorrow), Sameer and Neha (Meenakshi lapsed). **Launches (2):** Banyan Bay Residences · Phase 2 (Draft, launching in 4 days, 2 BHK ₹1.35–1.55 Cr · 3 BHK ₹1.85–2.1 Cr, EOI ₹2 L, possession Dec 2029, RERA PRM/KA/RERA/DEMO/0142; the Owner's 13 matches: Vikram Shah, Sana Fathima, Nisha Kulkarni, Rakesh Gupta, Aman Khurana, Sowmya Ramesh, Vinay Prabhu, Rajesh Naidu, Swati Agarwal, Tejas Patil, Bhavana Shenoy, Omkar Jadhav, Asha Thomas; Budget off adds Pooja Venkatesh, Zoya Begum and Nandini Bose) and Halcyon Grove · Tower D (Sent 6 days ago, 8 / 8 / 6 / 2 🧱, ₹6.88).
- **Fixed demo numbers** (`DEMO_METRICS`): follow-up rate 82% (+12%), weekly chart values, 18 calls this week (2h 14m), 72% answer rate (+8%).

## 5. Saved in the browser (localStorage)
All keys use the prefix `daira:v12:`: `viewer`, `settings`, `pretend-location`, `attendance-today`, `corrections`, `leave`, `added-members`, `member-status`, `added-leads`, `owners`, `assignments`, `lead-edits`, `notes`, `tags`, `activity`, `source-settings`, `arrivals`, `stages`, `deals` (offer history with dates, token and agreement dates, documents, splits), `closures` (won/lost), `visits` (visit records with steps and outcomes), `read-leads`, `chats`, `ai-suggestions`, `qualify-steps`, `tasks`, `completed-tasks`, `recordings`, `saved-properties`, `properties` (inventory incl. edits and additions), `property-shares` (Sent/Seen per lead), `cp-bookings` (M14 bookings with milestones, disputes and reminders), `cp-registrations` (developer registrations), `launches` (M14 launch broadcasts and their recipients), `inbox-replies` (buyer replies that arrived in the demo: unread and preview), `notifications` (everyone's, with read state), `audit`.
**Reset demo data** (account menu → confirm) deletes these, plus any older `daira:*` / `daira-*` keys, and reloads the page. Run it before every client demo.

## 6. Code map
See `AGENTS.md` for conventions. Each component has a matching `.css` file next to it.
- `src/App.tsx`: shell; owns the current view, the open lead, dialogs and toasts, and falls back when "View as" hides a screen.
- `src/data/bookOfLeads.ts`: the wider book of 34 quieter seed leads (no unread messages), appended to the scripted twelve.
- `src/data/channelPartner.ts`: M14 developers, projects, seed bookings, GST/TDS rates, brokerage maths, booking statuses, invoice numbering, reminder text.
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
- `src/data/brand.ts`: the product name (Bayana) and the brokerage's name (Better Days Realty), used in the nav, account menu and every buyer-facing message.
- `src/data/templates.ts`: WhatsApp templates, the 24-hour window, default auto-reply, qualification questions.
- `src/state/useDemoStore.ts`: all saved state, the viewer, visibility filtering, routing, activity log and timeline, duplicate lookup, derived numbers and actions.
- `src/lib/`: `ai.ts` (demo AI: reply drafts, lead score, weekly digest, M14 `parseGroupMessage` and the group-message samples), `location.ts` (one-off location readings: demo readings, the browser's real location, distance), `permissions.ts` (role → permissions, who sees which lead), `storage.ts` (localStorage), `format.ts` (dates, money, durations, phone masking), `csv.ts` (CSV text and browser download), `useEscapeKey.ts`.
- `src/components/`: `LeadRegistrations` (M14 registrations card in the lead panel), `ForwardShareSheet` (M14 phone share sheet demo), `DemoGuide` (guided demo panel), `AppNavigation` (sidebar with Work/Manage groups, phone top bar, tab bar with More sheet), `navigation.ts` (items with required permission), `Dialog` (the one modal / sheet / full-screen shell), `AccountMenu`, `Avatar`, `HeatBadge`, `LeadActions`, `LeadRow`, `LeadTimeline`, `LeadNotes`, `LeadTags`, `IncomingLeadBanner`, `LocationControl` (slim demo location strip), `TeamPulse` (daily summary tiles and AI weekly digest for the team home), `BarList` (single-series bar chart), `PropertyCard` (also `PropertyPhoto`), `NotificationBell` (bell + notifications panel), `Toast`, `Icon`.
- `src/state/channelPartner.ts`: M14 state and actions (`store.cp`: visible bookings, margin, invoice, payment, undo, dispute, reminder), used inside `useDemoStore`.
- `src/views/`: `BrokerageView` (M14 receivables), `LaunchesView` (M14 New launches: launches, registrations, my bookings), `TodayView`, `ChatView` (chat + lead panel), `PipelineView`, `PropertiesView`, `FollowUpsView`, `CallsView`, `VisitsView` (with the visit outcome form), `AttendanceView` (My day, Leave, Register with team calendar, Requests), `ReportsView` (my performance, leaderboard, scorecard, owner insights), `EscalationsView`, `LeadSourcesView`, `TeamView` (with invite dialog), `SettingsView`, `AuditView` (Owner's audit log with CSV exports).
- `src/modals/`: `ExportChatDialog` (chat export, UI only), `BookingDialogs` (M14 booking detail, recording dialogs, reminder), `LaunchWizard` (M14 new launch: details, audience, preview, send), `RegistrationDialogs` (M14 register, renew, dispute/resolve), `AddLeadModal` (with duplicate check), `EditLeadDialog` (structured buyer brief), `ScheduleVisitDialog`, `ReminderDialog` (Remind me / Add reminder), `TemplateDialog`, `AssignDialog` (people picker for assign / reassign / hand-off / deactivate), `DealDialog` (offer tracker + commission split; also `LostDialog`), `PropertyDialog` (add/edit listing), `ShareDialog` (pick lead → pick homes → WhatsApp preview → send), `CallPicker`, `CallModal`.
- `tests/e2e/`: 19 end-to-end suites (537 checks) covering every section of this spec, run with `pnpm test:e2e` (see its README for the suite → section map).
- `.github/workflows/deploy-pages.yml`: builds and publishes the demo to GitHub Pages on every push to `main`. Page title, description and no-index live in `.figma/make/site.json`.
- `src/index.css`: the only place raw colours are defined. Design tokens (colour, 4px spacing scale, radius, shadow, `--fs-*` type sizes, `--tap`) and shared classes (`.btn`, `.card`, `.chip`, `.count-badge`, `.status-dot`, `.icon-badge`, `.is-done` and more).

---

## 7. Known issues
- **TODO: bundle size.** `vite build` warns that the main JavaScript chunk is over 500 kB. Harmless for the demo, but it slows the first load on slow mobile connections. Fix: lazy-load the heavier screens (Brokerage, New launches, Performance, Calls) with `React.lazy` so they download when opened.
- Reminders keep the day they were set for: the demo has one "today", so tomorrow's reminders never move into today's list.
- Seeded lead times ("2m", "18m") are fixed values, so "Overdue" never appears or clears on its own. Seeded message times are worked out from them when the chat opens.
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
- **TODO: inbox green "online" dot** (§3.1 avatars, `Avatar` `online` prop, seeded `online` flags). WhatsApp's API doesn't report online status, so the dot has to go before a pilot. The chat header no longer shows it.
- **Chat export is UI only.** No file is created; the export is logged and nothing else happens.
- **TODO: property location pins** (§8.18). Listings added in the demo use the locality's centre, so visit check-ins are measured from the wrong place.
- Listings added in the demo have no photo upload. "Seen" is simulated, and it stays "Sent" if the page is reloaded within those 4 seconds.
- Photos need an internet connection.

## 8. Planned modules (approved; built items are marked ✅)
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

### 8.10 M10 · Deal closing — ✅ built (§3.2 Deal panel, §3.3, §3.14)
- **Won/Lost** stages (lost needs a reason); **move back** a stage; desktop drag-and-drop.
- **Offer tracker:** asking price, dated offer history (buyer offers and owner counters), agreed price, token amount and date, agreement target date, stale-offer flag after 7 days.
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
- **M14 (§8.17):** **New launches** (Work, everyone; Launches · Registrations) and **Brokerage** (first in Manage; Owner and Managers). On phones both are in **More**.

### 8.15 Backend notes for later (not part of the UI build)
- **Masked calling (India).** Click-to-call through a cloud-telephony provider such as Exotel, Knowlarity, MyOperator or Ozonetel. The provider rings the agent's phone, then connects the buyer, who sees the company's virtual number. The agent never sees the buyer's number.
  - **KYC** needs a registered business (company PAN, GST / MSME / incorporation certificate, address proof, authorised signatory); some providers accept proprietorships with Udyam/shop licence.
  - **Activation** is typically 1–3 business days after KYC (Exotel asks customers to escalate after 24 working hours).
  - In-browser (VoIP) calling needs extra paperwork and per-city KYC, so start with the phone bridge.
  - Promotional cold calls must use the 140 series; recording needs disclosure under the DPDP Act. Confirm with the provider and a lawyer.
  - **The Calls screen is provider-backed.** Call history, stats (calls, talk time, answer rate) and recordings come from the provider's call logs and recording files, through its API and webhooks. Calls made outside Bayana's Call button, such as a buyer calling back the virtual number, still land on the lead's timeline. In the demo all of this is simulated (§3.6).
  - **Decision for later:** Bayana holds one telephony account for all customers (Bayana does their KYC) or each brokerage connects its own account (simpler to start).
- **WhatsApp:** WhatsApp Business API through a provider; Meta business verification; templates must be approved before use.
- **AI:** LLM costs are per message; buyer data falls under the DPDP Act.

### 8.16 Build order (UI)
1. M1 + M2: roles, team, "View as", owner and reassignment.
2. M5 + M3: lead record, lead arrival.
3. M6 + M7 + M8: visits with check-in, attendance, leave with cover.
4. M9: reports and leaderboard (needs the realistic team data from steps 1–3).
5. M4, M13: chat automation and AI assist.
6. M10, M11, M12: closing, inventory, notifications and audit.
7. **Demo mode** — ✅ built as the guided demo (§3.16): a scripted run across all of the above (new 99acres lead → auto-reply → AI-filled brief → assigned → visit with verified check-in → won → leaderboard moves).
8. **M14 channel partner** (§8.17): receivables → developer registrations → launch broadcasts → WhatsApp group capture → guided-demo bonus.

### 8.17 M14 · Channel partner (new launches) — ✅ built: A receivables (§3.1 card, §3.15, §3.17) · B registrations (§3.1 banner, §3.2, §3.18) · C launches (§3.19) · D group capture (§2, §3.7, §3.11) · E guided-demo bonus and `DEMO_SCRIPT.md` (§3.16). The text below is the approved plan it was built from.
Developers pay CP brokerage late, and only after the buyer has paid a set share of the price. They pay only if the CP's registration of the buyer hasn't lapsed and no other CP registered the buyer first. Launches sell out in days, and many leads arrive in WhatsApp groups. Four parts, built in this order.

- **Navigation:**
  - **New launches** (Work, everyone, icon `bolt`, after Properties): tabs **Launches · Registrations**. It opens on Launches for people with `runLaunches`, otherwise Registrations.
  - **Brokerage** (first in Manage; `viewReceivables`; new `rupee` icon).
  - Phones: both in **More**; the bottom tabs don't change.
- **Permissions:** `viewReceivables` "See brokerage receivables" (Owner, Manager) · `manageReceivables` "Record invoices and payments" (Owner) · `runLaunches` "Create and send launch broadcasts" (Owner, Manager).
- **Who sees money:** the Owner sees all bookings. Managers see their team's agents' bookings with amounts. Sales and Pre-sales never see brokerage %, amounts or tax lines (commercially sensitive), only the status of their own bookings.
- **Seed** (`src/data/channelPartner.ts`):

| Developer | CP manager | Brokerage | Billable once buyer paid | Pays within | Registration valid |
|---|---|---|---|---|---|
| Halcyon Habitats | Rakesh Iyengar, +91 98450 70112 | 3% | 10% | 45 days of invoice | 30 days |
| Banyan Bay Developers | Deepa Raghunath, +91 99000 81455 | 2.5% | 10% | 60 days | 30 days |
| Kestrel Developers | Joseph D'Souza, +91 97400 62318 | 2% | 15% | 30 days | 45 days |
| Larkspur Estates | Nikhil Thakur, +91 96320 50947 | 2% | 20% | 30 days | 30 days |

- **Seed projects:**
  - **Halcyon Grove**, Whitefield: 2 BHK ₹1.1–1.35 Cr, 3 BHK ₹1.6–1.9 Cr.
  - **Banyan Bay Residences**, off Sarjapur Road, HSR Layout: 2 BHK ₹1.35–1.55 Cr, 3 BHK ₹1.85–2.1 Cr.
  - **Kestrel Heights**, Koramangala: 3 BHK ₹2.6–3.1 Cr, 4 BHK ₹3.3–3.8 Cr.
  - **Larkspur Residences**, Indiranagar: 3 BHK ₹2.6–3.2 Cr.
  - RERA numbers are plainly fake ("PRM/KA/RERA/DEMO/0142").

#### 8.17.1 Brokerage receivables (the Owner's money screen)
- **Booking:** a unit sold through the firm, with dated milestones **Booked → Margin money paid → Invoice raised → Payment received**.
  - Brokerage = agreement value × %. The detail sheet shows **GST @ 18%** (added), **TDS @ 2%** (deducted) and **Net receivable**, in rupees.
  - Headline figures are brokerage before GST and TDS.
  - **Statuses:** *Waiting for 10% payment* · *Ready to invoice* · *Due in N days* · **Overdue N days** (red; past the developer's terms) · *Paid* · **Disputed** (red, with a reason; still counted as pending).
- **Screen** ✅ "Brokerage", subtitle "What developers owe Better Days Realty · brokerage before GST and TDS":
  - **Stat strip:** **Pending** "₹42 L · 8 bookings" · **Overdue** "₹15.4 L · 3" · **Ready to invoice** "₹5.7 L · 1" · **Received · last 30 days** "₹3.5 L". New `formatLakh` drops a trailing ".0".
  - **Charts:** `BarList`s with table views: **Pending by developer** (largest first) and **Age since booking** (0–30 / 31–60 / 61–90 / 90+ days, in order; tooltip "₹10.6 L · 2 bookings"). Tapping a bar filters.
  - **Filters:** chips All · Overdue · Ready to invoice · Awaiting payment · Disputed · Paid, plus a developer dropdown. Most overdue first; **Paid · N** folded last.
  - **Desktop:** a table (buyer · unit, project, agent, agreement, brokerage, 4-dot milestone track, due, next-step button: **Mark margin paid** / **Raise invoice** / **Send reminder**).
  - **Phone:** cards ("Rajiv Menezes · Halcyon Grove B-1204", "₹4.86 L · 3% of ₹1.62 Cr", the track, "Overdue 43 days", a full-width button).
  - **Row detail:** milestones, tax lines, an invoice chip "BDR/26-27/014 · PDF (demo)" 🎭, reminder history, **Undo last step**, **Mark disputed** / **Resolve**. **Export CSV** (`exportData`, audited).
- **Recording** ✅ (`manageReceivables`; dates Today … 14 days ago):
  - **Raise invoice:** the next number is prefilled ("BDR/26-27/025", financial year from today).
  - **Record payment:** the amount is fixed to the net receivable; optional UTR; a "TDS certificate received" tick.
  - **Short payments:** Disputed · "Amount differs".
- **Send reminder** ✅ 🎭 (Owner, Manager): tone **Gentle · Firm** and an editable WhatsApp preview to the CP manager.
  - **Gentle:** "Hi Rakesh, a gentle reminder from Better Days Realty. Our invoice BDR/26-27/014 for ₹5,63,760 (Rajiv Menezes, Halcyon Grove B-1204) was raised on <date> and is 43 days past your 45-day terms. Could you share the payment date? Thanks, Arjun Khanna"
  - **Firm** ends: "…is 43 days overdue. Please release it this week, or tell us what's pending from our side."
  - **Send:** toast "Reminder sent to Rakesh Iyengar (Halcyon Habitats)", then "Last reminder · just now". About 4 s later the history gets the scripted reply 🎭 "Noted. Checking with accounts, will confirm the date by Friday."
- **From a won deal** ✅: if the lead has an active registration, the deal dialog offers "New-launch booking at Kestrel Heights" (off by default) and **Unit**.
  - Saving creates *Booked · today* (agreement = agreed price), sets the registration to **Booked** and notifies the Owner.
  - Lapsed registration → amber note: "Registration lapsed on <date>. The developer may refuse brokerage."
- **Sales and Pre-sales:** **My bookings** (foot of Registrations) shows status words only, e.g. "Invoice raised · awaiting developer payment".
- **Hooks:**
  - **Audit** (new type **Channel partner**): invoice raised, payment recorded (amount and invoice number), step undone, dispute marked or resolved.
  - **Notifications:**
    - Payment → the agent: "Kestrel Developers paid the brokerage for Vikrant Saluja. Your share goes out with this month's payout."
    - Dispute → the Owner and the agent's manager.
  - **Timeline:** "Booked Kestrel Heights T1-1404 · ₹2.65 Cr".
- **Seed bookings** (days ago; fixed invoice numbers; no linked lead, because they predate Bayana):

| Buyer | Project · unit | Agent | Agreement | Brokerage | Booked · margin · invoiced · paid | Today |
|---|---|---|---|---|---|---|
| Rajiv Menezes | Halcyon Grove B-1204 | Vivek S. | ₹1.62 Cr | 3% · ₹4.86 L | 120 · 95 · 88 (/014) | Overdue 43 days |
| Sunaina Dutta | Halcyon Grove A-0703 | Ayesha K. | ₹1.18 Cr | 3% · ₹3.54 L | 60 · 45 · 40 (/022) · 6 | Paid |
| Arun Pai | Halcyon Grove C-1502 | Manoj K. | ₹1.86 Cr | 3% · ₹5.58 L | 150 · 130 · 120 (/009) · 60 | Paid |
| Prerna Chatterjee | Banyan Bay 2-1103 | Sneha P. | ₹1.48 Cr | 2.5% · ₹3.70 L | 110 · 100 · 95 (/012) | Overdue 35 days |
| Manish Kothari | Banyan Bay 3-0405 | Rohit V. | ₹1.96 Cr | 2.5% · ₹4.90 L | 30 | Waiting for 10% payment |
| Farida Lokhandwala | Banyan Bay 1-0902 | Meghna D. | ₹1.52 Cr | 2.5% · ₹3.80 L | 75 · 60 · 58 (/019) | Due in 2 days |
| Vikrant Saluja | Kestrel Heights T2-1801 | Priya N. | ₹3.42 Cr | 2% · ₹6.84 L | 70 · 50 · 48 (/021) | Overdue 18 days |
| Ruchi Bhargava | Kestrel Heights T1-0602 | Aditya R. | ₹2.85 Cr | 2% · ₹5.70 L | 25 · 8 | Ready to invoice |
| Harpreet Sodhi | Kestrel Heights T2-2203 | Ritu B. | ₹3.10 Cr | 2% · ₹6.20 L | 45 · 30 · 28 (/024) | Disputed: "Developer says another CP registered this buyer first" |
| Neeraj Wadhwa | Larkspur Residences 3B | Divya I. | ₹3.00 Cr | 2% · ₹6.00 L | 15 | Waiting for 20% payment |

  - **By developer:** Kestrel ₹18.7 L, Banyan Bay ₹12.4 L, Larkspur ₹6 L, Halcyon ₹4.9 L.
  - **By age:** ₹16.6 L / ₹6.2 L / ₹10.6 L / ₹8.6 L.
  - **Managers:** Neha ₹18.5 L, Rahul ₹11.1 L, Farah ₹12.4 L, 1 overdue each.
- **Checks:**
  1. **Owner:** the strip and bars show the values above.
  2. **Rajiv's detail:** ₹4,86,000 · GST ₹87,480 · TDS −₹9,720 · Net ₹5,63,760.
  3. **Record payment on Rajiv:**
     - Strip: "₹37.1 L · 7 bookings", "₹10.5 L · 2", Received "₹8.4 L".
     - Audit: "Recorded payment ₹5,63,760 from Halcyon Habitats (BDR/26-27/014)".
     - Vivek is notified; Undo restores everything.
  4. **Raise invoice on Ruchi Bhargava:** "BDR/26-27/025", "Due in 30 days".
  5. **Gentle reminder:** the preview has "Hi Rakesh", "₹5,63,760" and "43 days"; the reply appears within 5 s.
  6. **Neha:** "₹18.5 L · 3 bookings"; Send reminder only.
  7. **Priya:** no Brokerage nav. My bookings lists Vikrant Saluja with no "₹".

#### 8.17.2 Developer client registration
- **Lead panel → Overview:** a **Developer registrations · N** card below the Deal panel. Each entry: "Kestrel Heights · Kestrel Developers", a status chip, "Valid until Fri, 23 Oct · 3 days left" with a thin meter, and who registered it. **Register with a developer** is for anyone who can see the lead (a bottom sheet on phones).
- **Register dialog** ✅:
  - **Fields:**
    - Project.
    - Buyer name (from the lead).
    - Mobile (`displayPhone`, read-only).
    - **PAN**, optional ("Some developers ask for it"; error "PAN should look like ABCDE1234F").
    - How you registered: Developer's CP portal / Email to CP manager / WhatsApp to CP manager.
    - Registered on: Today … 30 days ago.
    - Developer's reference.
  - **Add screenshot** 🎭 attaches a placeholder "registration-proof.png · demo".
  - **Footer:** "Bayana keeps your proof and reminds you before it lapses. It doesn't submit anything to the developer."
  - **Stamp:** "Recorded by Priya N. · Tue, 20 Oct, 2:14 PM".
  - **PAN** always shows masked ("XXXXXX234K", new `maskPan`); `seeFullNumbers` gets **Show**.
- **Conflict warning** ✅: checks every active registration in the firm, even on leads the viewer can't see, for the same phone and developer.
  - **Alert:** "Already registered with Kestrel Developers by Kavya R. on <date> · valid until <date>. The firm is already protected; registering again won't extend it and may confuse the developer's CP desk."
  - The submit button becomes **Register anyway**.
- **Statuses:**
  - **Registered**
  - **Expiring** (≤ 7 days, amber; "Expires tomorrow")
  - **Lapsed** ("Lapsed 2 days ago")
  - **Disputed** (manual: Another CP registered first / Developer has no record / Other)
  - **Booked** (countdown hidden)
- **Actions:**
  - **Renew:** new date and proof; restarts the window.
  - **Mark disputed:** anyone who can see the lead.
  - **Resolve** (Owner, Manager): "Developer accepted ours", or "Lost to another CP" (→ Lapsed).
- **Registrations tab** ✅:
  - Chips All · Expiring · Lapsed · Disputed · Booked, with counts; soonest expiry first.
  - Each row: buyer (→ chat), project, agent ("Registered by Kavya R. · lead now with Aditya R."), status, days left, **Renew**.
  - Lead visibility (§3.8) applies; cards on phones.
- **Hooks:**
  - **Notifications:**
    - At 7, 3 and 1 days left → the registering agent and the lead owner.
    - At 1 day and on lapsing → their manager too.
    - **Register anyway** → both managers and the Owner (also audited).
  - **Sales Today:** a banner like the check-in reminder at 3 days or fewer: "Ananya Rao's registration with Kestrel Developers expires in 3 days", with **Renew** and **Open lead**.
  - **Timeline** (kind `registration`): registered, renewed, disputed, resolved, "Registered anyway (already registered by Kavya R.)".
  - Time doesn't pass in the demo; alerts come from the seed.
- **Seed registrations:**

| Lead | Project | By | Registered | Today |
|---|---|---|---|---|
| Ananya Rao | Kestrel Heights | Priya N. | 42 days ago | Expiring · 3 days |
| Ishita Banerjee | Larkspur Residences | Priya N. | 10 days ago | Registered · 20 days |
| Kunal Mehra | Larkspur Residences | Priya N. | 12 days ago | Disputed · Another CP registered first |
| Gaurav Bhatia | Kestrel Heights | Kavya R. (lead now Aditya R.) | 30 days ago | Registered · 15 days |
| Meenakshi Raghavan | Larkspur Residences | Sameer J. | 32 days ago | Lapsed 2 days ago |
| Deepak Malhotra | Kestrel Heights | Ritu B. | 20 days ago | Registered · 25 days |
| Ishaan Malik | Halcyon Grove | Ayesha K. | 5 days ago | Registered · 25 days |
| Nisha Kulkarni | Banyan Bay Residences | Rohit V. | 23 days ago | Expiring · 7 days |
| Vikram Shah | Banyan Bay Residences | Sneha P. | 29 days ago | Expires tomorrow |

  - **Seed notifications:** Priya (Ananya), Rohit (Nisha), Sneha and Farah (Vikram), Sameer and Neha (Meenakshi lapsed). Arjun: "Halcyon Habitats: invoice BDR/26-27/014 for Rajiv Menezes is 43 days overdue." (opens Brokerage).
- **Checks:**
  8. **Priya, Ananya Rao's lead:** "Expiring · 3 days left"; the banner on her Today; the alert in her bell.
  9. **Priya registers Mohit Saxena** with Larkspur, PAN "ABCPM1234K": "Registered · 30 days left", "XXXXXX234K", a timeline entry. "ABC123" blocks Save.
  10. **The Owner registers Gaurav Bhatia** with Kestrel: the Kavya R. alert and **Register anyway**; saving is audited.
  11. **Owner's Registrations:** All 9 · Expiring 3 · Lapsed 1 · Disputed 1. **Renew** on Ananya → "45 days left", Expiring 2.
  12. **Ananya won with the booking ticked:** the registration reads Booked; a new booking shows "Waiting for 15% payment"; Pending rises by the agreed price × 2%.

#### 8.17.3 Launch broadcasts
- **Launches tab** ✅: cards with project, developer, locality, configurations and prices, launch day and status (Draft / Sent). Sent cards add "Sent 8 · Delivered 8 · Read 6 · Replied 2" and the cost. Without `runLaunches`: "N of your buyers match", and no New launch or Send.
- **New launch** (`runLaunches`; full screen on phones with a sticky button), three steps:
  1. **Details:** project (or a new one), configurations (BHK + price from/to, **+ Add configuration**), launch day, EOI, possession, and **RERA number**, which is required: "Add the RERA number. It must appear in every launch message."
  2. **Audience** ✅: open, visible leads matched on three on/off chips that update the count live ("13 buyers match"):
     - **Locality:** one of the lead's localities is the launch's.
     - **BHK:** a configured BHK. Investment flats match any; villas never.
     - **Budget:** overlaps that configuration's price band.

     Each row has a tick, the buyer, the owner, the reason ("HSR Layout · 2 BHK · ₹1.4–1.5 Cr fits ₹1.35–1.55 Cr") and "Registered with Banyan Bay" where it applies.
     - **Note** 🧱: "Only buyers who agreed to receive updates from Better Days Realty are included."
     - **Empty:** "None of your team's buyers match. Turn a filter off to widen it."
  3. **Preview** ✅: a WhatsApp bubble tagged **Marketing**:
     - "Hi Vikram, Banyan Bay Residences · Phase 2 by Banyan Bay Developers launches on Sat, 24 Oct off Sarjapur Road, HSR Layout. • 2 BHK · ₹1.35–1.55 Cr • 3 BHK · ₹1.85–2.1 Cr. Possession Dec 2029 · RERA PRM/KA/RERA/DEMO/0142. Early-access EOI ₹2 L (refundable). Want floor plans and a site visit? — Arjun, Better Days Realty"
     - Buttons **Yes, send details** · **Not now**, footer "Reply STOP to opt out".
     - Cost: "Marketing template · 13 × ₹0.86 = ₹11.18 (Meta's India rate, charged per delivered message)".
- **Send to 13 buyers** 🎭 (asks to confirm):
  - **Chats:** each one gets the message tagged "Template · New launch".
  - **Ticks:** grey ✓ → grey ✓✓ (~1.5 s) → blue ✓✓ (3–6 s), with text labels. New tokens `--tick-sent` / `--tick-read`, ≥ 3:1 contrast.
  - **Scripted:**
    - Omkar Jadhav: "Not delivered · not on WhatsApp".
    - Vinay Prabhu, Tejas Patil and Bhavana Shenoy: delivered, unread.
    - **Replies** (6–8 s): Nisha Kulkarni "Yes, send details", Aman Khurana "Any 3 BHK on a high floor, east facing? Is the EOI fully refundable?", Asha Thomas "Yes, send details".
  - **Replies** reach the inbox as buyer messages (1 unread, at the top).
  - **Cost** becomes "₹10.32 · 12 delivered".
  - **Other audiences:** about 80% read, and the first quarter reply.
- **Hooks:**
  - **Timeline** (kind `launch`): sent, each reply.
  - **Notifications:** reply → the lead owner ("Nisha Kulkarni replied to the Banyan Bay Phase 2 launch: 'Yes, send details'").
  - **Audit:** "Sent Banyan Bay Residences · Phase 2 to 13 buyers · ₹11.18".
- **Seed launches:**
  - **Banyan Bay Residences · Phase 2:** **Draft**, launching in 4 days, EOI ₹2 L. The Owner's 13 matches: Vikram Shah, Sana Fathima, Nisha Kulkarni, Rakesh Gupta, Aman Khurana, Sowmya Ramesh, Vinay Prabhu, Rajesh Naidu, Swati Agarwal, Tejas Patil, Bhavana Shenoy, Omkar Jadhav, Asha Thomas. Budget off adds Pooja Venkatesh, Zoya Begum and Nandini Bose.
  - **Halcyon Grove · Tower D:** **Sent 6 days ago**, 8 / 8 / 6 / 2 🧱, ₹6.88.
- **Checks:**
  13. **Owner, draft:** "13 buyers match"; Vikram Shah and Nisha Kulkarni tagged registered. Budget off → 16.
  14. **Preview:** has "Hi Vikram", the RERA number and "₹11.18". Clearing RERA blocks Next.
  15. **Send:** within 10 s:
      - Delivered 12 · Read 9 · Replied 3, and Omkar "Not delivered".
      - Nisha's chat has her reply, with 1 unread in the inbox.
      - Cost "₹10.32"; an audit entry.
  16. **Neha:** the empty state. **Priya:** no New launch or Send.

#### 8.17.4 WhatsApp group lead capture
- **Why simulated:** Bayana can't read a broker's own WhatsApp groups, so agents paste or share messages in.
- **Add lead** gets **Type it in · Paste a message**. Paste mode has:
  - a text box, "Paste a message forwarded from a broker group";
  - sample chips;
  - **Group** (HSR Brokers Network / Whitefield Property Connect / Bengaluru Realty Partners / Other);
  - **Read message**.
- **Reading** ✅ 🎭 (`parseGroupMessage` in `ai.ts`; rules, not a model):
  - **Finds:** the mobile (+91, 0 and spaces allowed); the name (after "Client:", "Contact" or "Call"); BHK or villa; localities (plus "HSR", "Kora", "WF"); the budget ("1.8–2.1 Cr", "90 L"); must-haves.
  - Fields show **AI · Suggested** until edited or **Confirm all**.
- **Number belongs to: The buyer · The broker who posted it.** The broker option is pre-picked on "brokers call", "Properties" or "Estates". Then the name becomes "Client of Manjunath (MG Estates)" with a **Co-broking** tag.
- **Listing text** ("available", "resale", "for sale"): "This looks like a property for sale, not a buyer's requirement." with **It's a buyer, continue**.
- **Saving:**
  - The §3.7 duplicate check runs on the found number.
  - Add lead's ownership rules apply.
  - Source is **Broker groups**, a new Lead sources row (Messaging, "Manual capture", 7 a week 🧱, ₹0).
  - The original message becomes a team note with numbers masked.
  - Timeline: "Captured from WhatsApp group HSR Brokers Network".
- **Phone share sheet** 🎭: account menu → **Simulate a forwarded group message** → "Share to" (WhatsApp, **Bayana**, Messages, Copy). **Bayana** opens paste mode with sample 1.
- **Samples:**
  1. "*URGENT requirement* 3 BHK in HSR / Koramangala, budget 1.8–2.1 Cr, OC received only. Client: Arnav Sethi 98451 62730. Loan pre-approved."
  2. "Need 2 BHK Indiranagar near metro, 1.5–1.7 Cr. Contact Farhan 97390 22814" (Farhan Qureshi's number)
  3. "Client requirement: 4 BHK villa Whitefield, 3.5–4 Cr, NRI visiting next week. Brokers with options call Manjunath 99000 81234 (MG Estates)"
  4. "Resale available: 2 BHK Indiranagar, 1,150 sq ft, ₹1.65 Cr, east facing. Call 98860 44120"
- **Checks:**
  17. **Sample 1** suggests Arnav Sethi, 98451 62730, 3 BHK, HSR Layout + Koramangala, ₹1.8–2.1 Cr. Saving creates a Broker groups lead with a masked note.
  18. **Sample 2:** the duplicate alert names Farhan Qureshi; Merge works.
  19. **Sample 3:** the broker is pre-picked and the lead tagged Co-broking. **Sample 4:** shows the listing note.
  20. **Phone (390 px):** the share sheet opens paste mode; controls ≥ 44 px. Layout audits pass for both new screens at 390, 900 and 1440 px.

#### 8.17.5 Today and the guided demo
- **Team home** (`viewReceivables`): a **Brokerage from developers** card below the four daily tiles (the tiles don't change):
  - "Brokerage pending · ₹42 L · 3 overdue"
  - "₹15.4 L overdue · oldest 43 days (Halcyon Habitats)"
  - "Registrations: 3 expiring this week · 1 lapsed"

  The money lines open Brokerage on Overdue; the last opens Registrations. Neha sees "₹18.5 L · 1 overdue" and "1 expiring · 1 lapsed".
- **AI digest** 🎭 adds: "Kestrel Developers owes ₹18.7 L across 3 bookings; Vikrant Saluja's invoice is 18 days overdue." and "3 developer registrations expire this week."
- **Guided demo (optional):** the finish card gets **Bonus: money developers owe you** (still "of 12").
  - It views as the Owner, opens Brokerage on Overdue, opens Rajiv Menezes and sends the Gentle reminder.
  - Panel text: "Developers pay brokerage late. Arjun sees ₹42 L pending and 3 overdue, and chases the oldest invoice in one tap."
  - `DEMO_SCRIPT.md` gains "send a launch" and "paste a group message".
- **Check:**
  21. The Owner's Today reads "₹42 L · 3 overdue"; tapping it shows 3 overdue rows.
- **Build notes:** `channelPartner.ts` (seed, rates, helpers incl. `buyersForLaunch`) · `BrokerageView`, `LaunchesView` · a `new-launch` Marketing template · saved keys `cp-bookings`, `cp-registrations`, `launches` · a `channel-partner` e2e suite.

#### 8.17.6 Out of scope
- Submitting registrations to developers or their portals.
- Real WhatsApp sending, template approval, opt-in collection, or reading groups automatically.
- Real invoices, e-invoicing, GST/TDS filing, bank feeds, agent payouts and part-payments.
- Brokerage slabs, incentive schemes and launch inventory.
- Using the developer's % on the leaderboard (won deals still count 2%).
- Moving the seed out of Bengaluru.

---

### 8.18 Property location pins · TODO (not built)
**Why:** visit check-ins compare the agent's phone with the property's stored location. Listings added in the demo use the locality's centre (§3.4), so a genuine visit can be refused ("1.4 km away") and a visit from the wrong place can be "verified". Both are wrong, so the location must be confirmed before a check-in can count.
- **Required pin:** Add property needs an address and a pin. The pin is set by dropping it on a map, or by the person standing at the building tapping **Use my location** (the reading and time are saved).
- **Who sets it:** the listing agent or a manager. Record who set the pin and when, and show it on the listing.
- **Unpinned listings:** until a listing has a pin, its visits show **Location not set** and can't be checked in as verified.
- **Corrections:** managers can move a pin. Every change goes in the audit log.
- **Known limits to design around:**
  - A pin can be placed on the wrong block, especially in dense areas (Indiranagar, HSR Layout).
  - Whoever sets the pin could place it near where they'll be. The setter should not gain from the visit, or the reading should be taken on site and recorded.
  - 200 m is too loose for large townships or villa plots; large projects may need a bigger radius or a pin per tower.
  - Phone GPS is often 50–150 m off inside buildings. The demo refuses readings worse than 100 m, which would refuse honest indoor check-ins; this rule must be softened before a real pilot.
  - Fake-GPS apps can't be blocked, so the product says "verified location", never "proof".
- **Real fix later:** a map and geocoding service (e.g. Google Maps or Mapbox) and a location-accuracy policy. Not part of the UI prototype.

## 9. Changelog
Newest first. One line per change: date, what changed, which section was updated.
- **2026-10-20:** Calls: stated that the call stats and recording playback are demo data until a telephony provider is connected (§3.6), and that the Calls screen is provider-backed (§8.15).
- **2026-10-20:** Removed the "Online on WhatsApp" / "Last seen" status from the chat header, which WhatsApp's API doesn't provide; it now shows "Last message <time> ago". Removed the AI call summary (demo text) from saved calls, the Calls screen and the landing page; calls save a plain note. Added **Export chat** UI (owner only, §3.2; nothing is downloaded, the export is audited). Recorded the property location pins as a TODO (§8.18) and the inbox online dot as a TODO (§7).
- **2026-10-20:** Removed the portal "shared lead" feature: the "shared with ~N brokers" figure on portal sources and leads, the "Also with N brokers" row flag, the lead-panel "Also sent to ~N brokers" warning, the arrival-banner line, and its AI score reason. Portal leads now carry no shared count (we have no source for it). Reworded the problem statement (§1), the guided demo's step 2 and the demo script. Saved-data prefix bumped to `daira:v12:`. Updated §1, §2, §3.1, §3.2, §3.11, §4, §5, §6, §8.5.
- **2026-10-20:** M14 phase E: guided demo **Bonus: money developers owe you** on the finish card (Owner → Brokerage on Overdue → Rajiv Menezes → gentle reminder with the scripted reply); Brokerage can open on a booking; `DEMO_SCRIPT.md` gains the bonus, sending a launch, registrations and pasting a group message. M14 is complete. Updated §3.16, §8.17.
- **2026-10-20:** M14 phase D: **WhatsApp group lead capture**. Add lead gets **Paste a message**: a rules-based reader suggests name, number, BHK, areas, budget and must-haves (AI · Suggested until edited or confirmed), tells a broker's number from a buyer's (Co-broking tag), flags listings, runs the duplicate check, and saves with source **Broker groups**, a masked team note and a timeline entry. Account menu → Simulate a forwarded group message opens a phone share sheet that hands the message to Bayana. New lead source Broker groups (Manual capture). Saved-data prefix `daira:v12:`. Updated §2, §3.7, §3.11, §4, §5, §6, §8.17.
- **2026-10-20:** M14 phase C: **launch broadcasts**. New launches opens on Launches for Owner/Managers: launch cards (draft / sent with delivered, read, replied and cost); New launch / Review and send in three steps (details with required RERA, live-matched audience on locality, BHK and budget with registered tags, WhatsApp preview with Meta's cost) and a confirmed send with scripted ticks and replies that land at the top of the inbox; "New launch" marketing template; seed draft and sent launch. Pipeline: the Won and Lost drop targets are now always visible in Closed (fixes a drag race found in testing). Updated §2, §3.1, §3.2, §3.3, §3.15, §3.19 (new), §4, §5, §6, §8.17.
- **2026-10-20:** M14 phase B: **developer registrations**. New launches screen (Work, everyone) with the Registrations list (filters, soonest expiry first, Renew) and My bookings for Sales/Pre-sales (status words only); Developer registrations card in the lead panel; Register dialog with PAN validation/masking, proof and a firm-wide conflict warning (Register anyway is notified and audited); Renew, Mark disputed, Resolve; Sales Today banner when a registration lapses within 3 days; third line on the Owner's brokerage card and a digest line; winning a registered lead can record a new-launch booking. Seed: 9 registrations and 6 alerts. Saved-data prefix `daira:v12:`. Updated §2, §3.1, §3.2, §3.3, §3.18 (new), §4, §5, §6, §8.17.
- **2026-10-20:** M14 phase A: **Brokerage receivables**. New Brokerage screen (Manage; Owner and Managers): stat strip, pending by developer and by age (with table view), filters, desktop table / phone cards, booking detail with GST, TDS and net, raise invoice, record payment, undo, disputes, WhatsApp reminders with a scripted reply, CSV export. **Brokerage from developers** card on the team home and a digest line. New permissions (see receivables, record invoices and payments, send launch broadcasts), audit type Channel partner, three notification kinds and one seed alert for Arjun. Saved-data prefix `daira:v12:`. New `channel-partner` e2e suite. Updated §2, §3.1, §3.8, §3.15, §3.17 (new), §4, §5, §6, §8.17.
- **2026-10-20:** Batch 3. **Guided demo** now 12 steps: opens on the Owner's team home, shows the telecaller's call queue, hands over from Pre-sales in their own view, and sets a "Call back Thursday" reminder before the visit. **Wider book of 34 seed leads** (46 in all) with 6 more upcoming visits and 3 more deals, so every salesperson has a realistic handful; the scripted twelve still top the inbox and drive escalations. Inbox shows 12 rows until **Show all** (filters and search list every match); on tablet/phone the team home puts the digest above the inbox. Colour rule written down (mint only on navy surfaces and the brand mark, indigo for main buttons on light surfaces, soft green for WhatsApp and positive actions). Added `DEMO_SCRIPT.md` (the presenter's script). Saved-data prefix bumped to `daira:v8:` so browsers with older saved visits and deals pick up the new seed. Updated §3.1, §3.16, §4, §5, §6.
- **2026-10-20:** Demo polish batch 2. **Team home** on Today for Managers/Owner (daily summary tiles + AI digest + team follow-ups; moved off Performance). **Pre-sales:** no Visits screen (new *run and track property visits* permission), phone tabs Today · Pipeline · Follow-ups · Calls, Today leads with "Up next · call" and "Your queue", chat bar has **Hand to Sales**. **Remind me** in the chat bar and a real **Add reminder** dialog (buyer, what, day, time, how) with a **Coming up** list; the fixed extra reminder is gone. **One name per screen** (Today, Follow-ups) on every size. **Lighter lead rows** (one flag, owner and source as plain text, "Also with N brokers"). **Lead panel** reordered (shared warning and AI score first, AI suggestions above matches, matches above the brief, ownership history folded). **Phone location** demo control is a slim strip. **Full-screen chat on phones.** New `follow-ups` e2e suite. Updated §2, §3.1, §3.2, §3.5, §3.8, §3.12, §3.13, §3.14, §4, §6, §7.
- **2026-10-20:** Rebrand to **Bayana** (app name only) with the workspace **Better Days Realty** (`src/data/brand.ts`): sidebar shows both, phone top bar Bayana only, account menu shows the workspace; buyer-facing messages (auto-reply, Welcome template, welcome quick reply) use the brokerage name; tab title "Bayana · WhatsApp-first CRM demo". Demo polish: seeded chat times count back from now with day labels; Share homes / Plan visit bar above the chat on every width (removed from the lead panel); Today's static follow-up-rate card replaced by a live "Waiting for a reply" card and phone day cards made compact; follow-ups sorted by time; refused check-in toast shows an alert icon; guided demo step 10 spotlights the salesperson's leaderboard row; Ananya's message and task now match her visit today at 11:30; AI score says "replied just now"; ownership-history line fixed; account menu closes on Escape. Saved-data prefix bumped to `daira:v8:` so browsers that opened the old build start fresh. Updated §1, §2, §3.1, §3.2, §3.5, §3.16, §5, §6, §7.
- **2026-10-20:** Desktop pipeline is drag and drop only: compact cards (owner · need, amount with intent tag, stale-offer flag; no last message or move buttons), Won / Lost drop zones on Closed while dragging (any stage), drag a closed card back to a stage to reopen it; buttons stay on tablet/phone and appear on keyboard focus. Updated §3.3; `deal-closing` and `layout-audit` suites now drag on desktop.
- **2026-10-20:** The end-to-end checks used during the build now live in the repo (`tests/e2e/`, `pnpm test:e2e`): 17 suites, 389 checks, including layout audits at three widths; they can also run against the live site. No behaviour change. Updated §6.
- **2026-10-20:** Published as a shareable demo on GitHub Pages (https://darthmuzammil.github.io/WhatsApp-firstCRMDesignDirections/), redeployed on every push to main; browser tab title is now "Daira · WhatsApp-first CRM demo" (search engines still told not to index it). Updated §6.
- **2026-10-20:** Offer history on deals: dated buyer offers and owner counters (log, remove, timeline entry each), token paid date, agreement target date, "No new offer in N days" flag after 7 days on the pipeline card and Deal panel; seeded histories (Rohan & Meera stale at 9 days). Matching breaks ties by closeness to the budget middle, so Lavanya's match and seeded visit are Palm Grove Villas (₹4.20 Cr), matching her deal. Storage bumped to v6. Updated §3.2–§3.4, §3.12, §3.16, §4, §5, §8.10.
- **2026-10-20:** Quick fixes: Add lead moves from the Today header to the sidebar (every screen, desktop/tablet); Due today items open the lead's chat; toasts appear at the top (under the top bar on phones) so they never cover the chat composer. Removed fixed and stale known issues. Updated §2, §3.1, §3.7, §7.
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
