import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
// Owner analytics (spec §3.1 window countdown, §3.2, §3.14 Speed to lead, Leads at risk, Listings that earn their visits).
const b = await chromium.launch()
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m)
const errs = []
let p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800)
const nav = (l) => p.click(`.sidebar-nav button:has-text("${l}")`)
const menu = async (l) => { await p.click('.sidebar-user .account-menu-trigger'); await p.click(`.account-menu-popover button:has-text("${l}")`); await p.waitForTimeout(300) }
const viewAs = menu
const sendQuickReply = async () => { await p.click('.quick-replies button >> nth=0'); await p.click('.send-button'); await p.waitForTimeout(200) }
// 24-hour window countdown
ok((await p.locator('.inbox-filters .segmented button:has-text("Closing")').innerText()).replace(/\s+/g, ' ') === 'Closing · 3', 'owner inbox offers a "Closing · 3" filter')
await p.click('.inbox-filters .segmented button:has-text("Closing")')
ok(await p.locator('.lead-row').count() === 3 && await p.locator('.lead-row time.is-closing').count() === 3, 'the filter lists the three chats, each counting down')
ok(/^Closes in \d+h \d+m$|^Closes in \d+h$|^Closes in \d+m$/.test(await p.locator('.lead-row:has-text("Revathi") time').innerText()), `Revathi's row reads "${await p.locator('.lead-row:has-text("Revathi") time').innerText()}"`)
const digest = await p.locator('.today-digest .digest').innerText()
ok(digest.includes('3 chats leave the free 24-hour WhatsApp window'), 'digest counts the closing windows')
ok(/Portal leads waited a median \d+ min for a human reply this month; .+ is slowest on \w+/.test(digest), 'digest has the speed-to-lead line')
// Speed to lead
await nav('Performance')
ok(await p.locator('.speed-table tbody tr').count() === 18, `owner speed table: 15 salespeople + 3 pre-sales (got ${await p.locator('.speed-table tbody tr').count()})`)
ok(await p.locator('.speed-table thead th').count() === 9, 'columns: person, 7 sources, All')
ok(await p.locator('.speed-table td.band-good').count() > 0 && await p.locator('.speed-table td.band-bad').count() > 0 && await p.locator('.speed-table td:has-text("—")').count() > 0, 'cells carry colour bands and dashes for no leads')
ok(/Within 5 minutes: \d+% of portal leads · slowest source: [\w ]+ \(median \d+ min\)/.test(await p.locator('.speed-card .card-head p').innerText()), 'headline: share within 5 min and the slowest source')
await p.click('.speed-table tbody tr >> nth=0 >> button'); ok(await p.locator('.scorecard-dialog').isVisible(), 'a row opens the scorecard'); await p.keyboard.press('Escape'); await p.waitForTimeout(200)
// Leads at risk
const riskRows = () => p.locator('.risk-list li:not(.stuck-empty)').count()
const before = await riskRows()
ok(before === 14, `owner: 14 leads at risk (10 quiet + 4 stuck; got ${before})`)
ok(/^₹[\d.]+ Cr across 14 leads/.test(await p.locator('.risk-card .card-head p').innerText()), 'header totals the money at risk')
ok(await p.locator('.risk-list em:has-text("Quiet")').count() === 10 && await p.locator('.risk-list em:has-text("Stuck in")').count() === 4 && await p.locator('.risk-list em:has-text("No follow-up set")').count() >= 8, 'reasons: quiet, stuck, no follow-up')
ok(await p.locator('.risk-agents tbody tr').count() >= 8, 'money at risk by agent')
await p.screenshot({ path: `${SHOTS}/analytics-owner.png` })
await p.click('.risk-list li:has-text("Omkar") button'); await p.waitForTimeout(300); await sendQuickReply()
await nav('Performance')
ok(await p.locator('.risk-list li:has-text("Omkar")').count() === 0 && await riskRows() === before - 1, 'a WhatsApp message takes the lead off the list')
// Listings that earn their visits
const rows = await p.locator('.listing-table tbody tr').allInnerTexts()
ok(rows.length === 8 && rows[0].startsWith('The Courtyard House'), 'listings sorted by verified visits, Courtyard first')
ok(await p.locator('.listing-table .lead-flag:has-text("Retire?")').count() === 2, 'Retire? on the two listings with 6+ verified visits and no deal')
ok(await p.locator('.listing-table tr:has-text("Brookside") .lead-flag:has-text("Location not set")').count() === 1 && await p.locator('.listing-table tr:has-text("Cedar Row") .lead-flag:has-text("Sold")').count() === 1, 'Brookside flagged Location not set; Cedar Row Sold')
ok(await p.locator('.insights-grid .bar-list[aria-label="Visits by property"]').count() === 0 && await p.locator('.stuck-list:not(.risk-list)').count() === 0, 'old Property interest chart and Stuck leads list are gone')
// 24-hour window in the chat
await nav('Today'); await p.click('.inbox-filters .segmented button:has-text("Closing")')
await p.click('.lead-row:has-text("Revathi")'); await p.waitForTimeout(300)
ok((await p.locator('.chat-person span').innerText()).includes('window closes in 2h'), 'chat header shows the countdown')
ok((await p.locator('.window-warning').innerText()).startsWith('Reply within 2h'), 'chat shows the reply-within warning above the composer')
await sendQuickReply()
ok(await p.locator('.window-warning').count() === 1, 'an agent reply does not re-open the window (only the buyer can)')
await p.screenshot({ path: `${SHOTS}/analytics-window-chat.png` })
// Live first reply to a demo arrival
await nav('Today'); await menu('Simulate incoming lead'); await p.click('.incoming-lead .btn:has-text("Reply now")'); await p.waitForTimeout(300); await sendQuickReply()
await nav('Performance')
ok(/This demo: Arjun K\. replied to a [\w ]+ lead in \d+ min/.test(await p.locator('.speed-foot').innerText()), 'live first reply listed under the table')
// Manager and Sales scope
await viewAs('Neha Kapoor'); await nav('Performance')
ok(await p.locator('.speed-table tbody tr').count() === 5, 'manager: her 5 salespeople in the speed table')
const neha = await p.locator('.risk-list').innerText()
ok(await riskRows() === 3 && neha.includes('Tanvi') && neha.includes('Ritika') && neha.includes('Gaurav'), 'manager: only her team at risk (Tanvi, Ritika, Gaurav)')
await viewAs('Priya Nair'); await nav('Performance')
ok(await p.locator('.speed-card').count() === 0 && await p.locator('.risk-card').count() === 0, 'sales: no speed table or risk list')
await nav('Today')
ok((await p.locator('.day-stat.warm').innerText()).replace(/\u00a0/g, ' ').includes('1 chat closes within 3 h'), 'Priya\'s Waiting card notes 1 chat closing (Mohit)')
ok(await p.locator('.lead-row:has-text("Mohit") time.is-closing').count() === 1, 'Mohit counts down in Priya\'s inbox')
await p.close()
// Phone
p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push(e.message))
await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800)
await p.click('.mobile-tab-bar button:has-text("More")'); await p.click('.more-sheet button:has-text("Performance")'); await p.waitForTimeout(400)
ok(await p.locator('.speed-card').count() === 1 && await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'phone: speed table scrolls inside its card, no sideways page scroll')
await p.locator('.risk-card').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SHOTS}/analytics-phone-risk.png` })
// Sales on a phone: the closing-chats note keeps "3 h" together on one line
await p.click('.mobile-top-bar .account-menu-trigger'); await p.click('.account-menu-popover button:has-text("Priya Nair")'); await p.waitForTimeout(300)
await p.click('.mobile-tab-bar button:has-text("Today")'); await p.waitForTimeout(300)
const together = await p.evaluate(() => {
  const note = document.querySelector('.day-stat-note'); if (!note) return 'missing'
  const text = [...note.childNodes].find((n) => n.nodeType === 3 && /3\s*h/.test(n.textContent))
  if (!text) return 'no text'
  const at = text.textContent.search(/3\s*h/); const range = document.createRange(); range.setStart(text, at); range.setEnd(text, at + 3)
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size === 1
})
ok(together === true, `phone: "3 h" in "1 chat closes within 3 h" stays on one line (${together})`)
ok(errs.length === 0, 'no console errors ' + errs.join(' | '))
await b.close()
