# Bayana: client demo script (about 15 minutes)

Live demo: https://darthmuzammil.github.io/WhatsApp-firstCRMDesignDirections/
What the app does is described in `PRODUCT_SPEC.md`; this is the order to show it in.

## Before the meeting
- Open the live link on the laptop you'll present from, then **account menu (⋯ next to your name) → Reset demo data**.
- Make sure you have internet (listing photos load from the web).
- Present full screen at desktop width. To show "the agent's phone", the guided demo switches people for you; you don't need a real phone.
- The workspace is **Better Days Realty**. To demo for another brokerage, change `BROKERAGE` in `src/data/brand.ts`.

## The script: Start guided demo (account menu), one button per step

| # | Step | What to say | Wow moment |
|---|---|---|---|
| 1 | The Owner's morning | "This is what Arjun sees at 9 AM: who's overdue, who hasn't checked in, today's visits and leave requests, one tap each. The AI digest says what needs attention." | Tap a tile: it opens the screen that fixes it. |
| 2 | A buyer enquires on 99acres | "A portal lead lands, gets an instant WhatsApp reply from Better Days Realty, and is routed to a telecaller. The buyer hears back in seconds." | Speed to lead. |
| 3 | Auto-qualification and the AI brief | "Bayana asks budget, area and move-in on WhatsApp. AI fills the brief; a person accepts it." | Answers stream in on their own. |
| 4 | The telecaller's call queue | "Telecallers get a queue, not a dashboard: who to call next, one tap to call." | Phone numbers are masked for them. |
| 5 | Hand to Sales | "Qualified: one tap hands it to the HSR salesperson. Notification sent, audit log updated." | |
| 6 | Share a match and book the visit | "Matches come with reasons. Share on WhatsApp, book a visit, the buyer gets a confirmation." | The WhatsApp preview and "Seen". |
| 7 | A follow-up in four taps | "Remind me → Call back → Thursday. It lands in Follow-ups with a Call button." | |
| 8 | Refused check-in | "Sneha taps Check in from 1.4 km away. Refused. Sneha's manager and the Owner are told." | **The big one for owners.** |
| 9 | Verified check-in | "At the property: verified, with distance and time on the lead's timeline." | |
| 10 | Visit outcome | "Checking out asks what the buyer thought and the next step." | |
| 11 | Negotiate and win | "Every offer and counter is dated, plus token, documents and commission split." | Card moves to Closed. |
| 12 | The leaderboard moves | "Back as the Owner: Sneha's commission went up, live." | Sneha's row pulses green. |

## Bonus: the money developers owe (2 minutes, highly recommended for new-launch brokers)
On the guided demo's finish card, tap **Bonus: money developers owe you**, then **Chase the most overdue invoice**.
- Say: "Developers pay channel-partner brokerage late. Arjun sees ₹42 L pending and 3 overdue, and chases the most overdue invoice in one tap." The reminder goes to Halcyon Habitats' CP manager on WhatsApp, and a reply arrives a few seconds later.
- Point at the detail: brokerage ₹4,86,000, GST, TDS and the net ₹5,63,760, and the 4-step milestone track.

## Channel partner, if the client sells new launches (pick what fits)
- **Send a launch** (as the Owner): New launches → Banyan Bay Residences · Phase 2 → **Review and send**. Show "13 buyers match", turn Budget off (16) and on again, point at "Registered with Banyan Bay", then the preview (RERA in the message, ₹11.18 cost) → **Send to 13 buyers** → **Send now**. Within ten seconds: ticks turn blue, Omkar isn't on WhatsApp, and Nisha, Aman and Asha reply at the top of the inbox.
- **Registrations**: New launches → Registrations (3 expiring, 1 lapsed). Then View as Priya: Priya's Today warns "Ananya Rao's registration with Kestrel Developers expires in 3 days" → **Renew**. On Gaurav Bhatia (as the Owner), **Register with a developer** → Kestrel Heights shows "Already registered … by Kavya R." This stops two agents registering the same buyer.
- **Paste a group message**: Add lead → **Paste a message** → sample "3 BHK · HSR / Kora" → **Read message**: every field is filled and marked AI · Suggested. Try "Villa · from a broker" (it spots the broker's number and tags Co-broking) and "Resale listing" (it warns that it's a listing). On a phone: account menu → **Simulate a forwarded group message** → Share to **Bayana**.

## After the guided demo (pick 2–3)
- **Escalations** (Owner): overdue replies and unassigned leads, assign in one tap.
- **Performance → cost per deal by lead source**: "which portal is worth paying for".
- **Attendance → Requests → Approve leave with a cover**, then **Start cover now (demo)**: the person's leads move to the cover. Leave-aware handover is unique.
- **Pipeline** on desktop: drag a card between stages; drop on Closed → Won / Lost.
- **Any chat → AI drafts** (sparkle in the composer): English, Hindi, Kannada + English.
- **Audit log** (Owner): every reassignment, setting and export.

## Questions to expect
- WhatsApp Business API and per-conversation charges (the launch preview shows Meta's ₹0.86 per marketing message) · developer portals (Bayana records registrations and proof; it doesn't submit them) · GST and TDS on brokerage (demo rates; confirm with their CA) · how 99acres / MagicBricks / Housing leads come in · price per seat vs LeadSquared and Leadrat · importing their Excel data · what stops an agent leaving with clients (masked numbers, in-app calling) · fake-GPS apps (we say "verified location", never "proof") · offline use · Hindi and Kannada · onboarding time.

## Don't click
- **"This device"** in Phone location on a laptop: it asks for location permission and the reading is inaccurate, so check-ins get refused.
- **Reloading the page** during the guided demo: it ends the guide.
- **Simulate incoming lead** more than 6 times: the buyers repeat.
- **Sending the Banyan Bay launch twice**: after the first send it's no longer a draft; reset demo data to show it again.
- **Invite person**, then trying to log in as them: there's no login.
- **Calls stats** or **Connect / Disconnect** on Lead sources: they look canned.
