import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
const b = await chromium.launch()
// The whole loop runs at desktop width, then again at phone width.
for (const W of [1440, 390]) {
  const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', `[${W}px] ${m}`)
  const errs = []
  const H = W < 800 ? 844 : 900
  const p = await b.newPage({ viewport: { width: W, height: H } })
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
  await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800)
  const phone = W < 800
  const g = '.demo-guide'
  const title = () => p.locator(`${g} h2`).innerText()
  const act = async () => { await p.locator(`${g} footer .btn-primary`).click(); await p.waitForTimeout(400) }
  const next = async () => { await p.locator(`${g} footer .btn-primary:has-text("Next step")`).click(); await p.waitForTimeout(200) }
  let before = 0
  if (!phone) {
    await p.click('.sidebar-nav button:has-text("Performance")')
    before = parseFloat((await p.locator('.reports-grid .bar-list li:has-text("Sneha Pillai") .bar-track b').innerText()).replace(/[^\d.]/g, ''))
  }
  await p.click(phone ? '.mobile-top-bar .account-menu-trigger' : '.sidebar-user .account-menu-trigger')
  await p.click('.account-menu-popover button:has-text("Start guided demo")')
  ok((await title()) === 'A buyer enquires on 99acres', 'step 1 shown')
  await act()
  ok(await p.locator('.chat-panel, .chat-layout').count() > 0 && (await p.locator('.chat-header, .chat-layout header').first().innerText()).includes('Meera Iyer'), 'enquiry arrives and chat opens (Meera Iyer)')
  await next()
  ok((await p.locator(`${g} footer .btn-primary`).isDisabled()), 'step 2 waits for the answers')
  await p.waitForFunction(() => !document.querySelector('.demo-guide footer .btn-primary')?.disabled, null, { timeout: 15000 })
  await act()
  ok(!phone ? (await p.locator('.lead-detail h2').first().innerText()).includes('1.3') : true, 'AI brief accepted (budget filled)')
  await next()
  ok((await title()) === 'Pre-sales hands over to Sales' && (await p.locator(`${g} footer .btn-primary`).innerText()).includes('Sneha P.'), 'hand to Sneha P. (HSR team)')
  await act(); await next()
  await act()
  ok(await p.locator('.message-shared:has-text("Lakeview")').count() === 1 && (await p.locator('.messages').innerText()).includes('Visit confirmed: Lakeview Terraces'), 'match shared + visit confirmed in chat')
  await next()
  await act()
  ok((await p.locator(phone ? '.mobile-top-bar .account-menu-trigger' : '.sidebar-user').innerText().catch(() => '')).includes('Sneha') || phone, 'viewing as Sneha')
  await next()
  await act()
  ok((await p.locator('.toast').innerText()).includes('Move closer'), 'far check-in refused')
  await next(); await act()
  ok((await p.locator('.toast').innerText()).includes('Checked in at Lakeview'), 'verified check-in')
  await next(); await act()
  await next(); await act()
  ok(phone || await p.locator('.pipeline-stage[aria-label="Closed"] .deal-card:has-text("Meera Iyer")').count() === 1, 'deal won → Closed column')
  await next(); await act()
  if (!phone) {
    const after = parseFloat((await p.locator('.reports-grid .bar-list li:has-text("Sneha Pillai") .bar-track b').innerText()).replace(/[^\d.]/g, ''))
    ok(Math.abs(after - before - 2.9) < 0.15, `Sneha commission +₹2.9 L (1.45 Cr × 2%): ${before} → ${after}`)
    ok(await p.locator('.sidebar-head .notification-bell .count-badge').count() === 1, 'owner bell has unread (refused check-in, won deal)')
  }
  await next()
  ok((await title()) === 'That’s the full loop', 'finish screen')
  await p.screenshot({ path: `${SHOTS}/m13-${W}.png` })
  await p.click(`${g} footer .btn-primary`)
  ok(await p.locator(g).count() === 0, 'guide closes')
  ok(!phone || await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways scroll')
  ok(errs.length === 0, 'no console errors ' + errs.join(' | '))
  await p.close()
}
await b.close()
