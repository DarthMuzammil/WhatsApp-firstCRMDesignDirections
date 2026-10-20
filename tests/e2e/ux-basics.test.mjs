import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
const b = await chromium.launch()
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m)
// Desktop checks
let p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800)
// 2. Back returns to origin + nav highlight
await p.click('.sidebar-nav button:has-text("Pipeline")'); await p.click('.deal-person >> nth=0')
ok(await p.locator('.sidebar-nav button.active').innerText().then(t => t.includes('Pipeline')), 'chat opened from Pipeline keeps Pipeline highlighted')
await p.click('.chat-head button[aria-label="Back"]'); ok(await p.locator('.pipeline-view').count() === 1, 'Back returns to Pipeline')
await p.click('.sidebar-nav button:has-text("Follow-ups")'); await p.click('.task-copy >> nth=0'); await p.click('.chat-head button[aria-label="Back"]')
ok(await p.locator('.followups-view').count() === 1, 'Back returns to Follow-ups')
// 4. Up next follows bookings
await p.click('.sidebar-nav button:has-text("Today")')
ok((await p.locator('.day-focus-more').innerText()).includes('+3 more visits'), 'seed: up next shows "+3 more visits booked"')
await p.click('.lead-row:has-text("Sana")'); await p.click('.lead-detail .lead-actions button:nth-child(2)'); await p.click('.add-lead .add-lead-submit')
await p.click('.sidebar-nav button:has-text("Today")')
ok((await p.locator('.day-focus-more').innerText()).includes('+4 more visits'), 'booking Sana adds a visit ("+4 more")')
// 3. Reset confirm: Cancel keeps data, Escape closes, focus lands on Cancel
await p.click('.sidebar-user .account-menu-trigger'); await p.click('.account-menu-popover button:has-text("Reset demo data")')
ok(await p.evaluate(() => document.activeElement?.textContent) === 'Cancel', 'confirm dialog focuses Cancel')
await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab')
ok(await p.evaluate(() => !!document.activeElement?.closest('.confirm-dialog')), 'Tab stays inside the dialog')
await p.keyboard.press('Escape'); ok(await p.locator('.confirm-dialog').count() === 0, 'Escape closes confirm')
ok((await p.locator('.day-focus-more').innerText()).includes('+4 more'), 'cancelled reset keeps booked visit')
// Focus return after Add lead dialog closes
await p.click('.sidebar-add'); await p.keyboard.press('Escape')
ok(await p.evaluate(() => document.activeElement?.classList.contains('sidebar-add')), 'focus returns to Add lead button')
// Call dialog not dismissible once connected
await p.click('.sidebar-nav button:has-text("Calls")'); await p.click('.page-head .btn-primary'); await p.click('.contact-list button >> nth=0'); await p.waitForTimeout(1600)
await p.keyboard.press('Escape'); ok(await p.locator('.call-modal').count() === 1, 'Escape does not drop a live call')
await p.close()
// Phone checks: 1. details sheet
p = await b.newPage({ viewport: { width: 390, height: 844 } })
await p.goto(BASE_URL); await p.waitForTimeout(800)
await p.click('.lead-row >> nth=0'); await p.click('.chat-details-button')
ok(await p.locator('.dialog-sheet .buyer-brief').isVisible(), 'phone details sheet shows buyer brief')
await p.screenshot({ path: `${SHOTS}/mob-details-sheet.png` })
await p.keyboard.press('Escape'); ok(await p.locator('.dialog-sheet').count() === 0, 'details sheet closes')
await p.click('.account-menu-trigger:visible'); await p.click('.account-menu-popover button:has-text("Reset demo data")')
const box = await p.locator('.confirm-dialog').boundingBox(); ok(box && box.y > 100 && box.width > 300, 'phone reset confirm is centred on screen (portal escapes top bar)')
await p.screenshot({ path: `${SHOTS}/mob-reset-confirm.png` })
await b.close()
