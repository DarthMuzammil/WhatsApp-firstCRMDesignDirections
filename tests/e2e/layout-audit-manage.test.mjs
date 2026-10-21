import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
const b = await chromium.launch()
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m)
// Same layout checks as layout-audit, for the screens added with roles (Visits, Attendance, Performance, Manage).
for (const [tag, w, h] of [['desk', 1440, 900], ['tab', 900, 1000], ['mob', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = []
  p.on('pageerror', e => errs.push(e.message))
  await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800)
  const go = async (label) => { const l = p.locator(`.sidebar-nav button:has-text("${label}"):visible, .mobile-tab-bar button:has-text("${label}"):visible`).first(); if (await l.count()) await l.click(); else { await p.click('.mobile-tab-bar button:has-text("More")'); await p.waitForTimeout(300); await p.click(`.more-sheet button:has-text("${label}")`) } await p.waitForTimeout(400) }
  const audit = async (name) => {
    const r = await p.evaluate((isMob) => {
      const W = document.documentElement.clientWidth, small = [], taps = [], over = []
      for (const e of document.querySelectorAll('body *')) {
        const rect = e.getBoundingClientRect(); if (!rect.width) continue
        if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 11) small.push(f + ':' + e.textContent.trim().slice(0, 20)) }
        if (rect.right > W + 1 && !e.closest('.permissions-table,.chip-row,.register-scroll,.report-table-scroll')) over.push(String(e.className).slice(0, 30))
        if (isMob && e.tagName === 'BUTTON' && (rect.height < 36 || rect.width < 36)) taps.push((e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 20) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height))
      }
      return { small: small.slice(0, 5), taps: [...new Set(taps)].slice(0, 6), over: [...new Set(over)].slice(0, 5), hscroll: document.documentElement.scrollWidth > W }
    }, tag === 'mob')
    ok(!r.small.length && !r.taps.length && !r.over.length && !r.hscroll, `${tag} ${name}: layout clean${r.small.length || r.taps.length || r.over.length || r.hscroll ? ' ' + JSON.stringify(r) : ''}`)
    await p.screenshot({ path: `${SHOTS}/m1-${tag}-${name}.png` })
  }
  for (const v of ['Visits', 'Attendance', 'Performance', 'Escalations', 'Lead sources', 'Team', 'Settings', 'New launches']) { await go(v); await audit(v.toLowerCase()) }
  await go('Escalations'); await p.click('.escalation .btn >> nth=0'); await p.waitForTimeout(500); await audit('assign')
  await p.keyboard.press('Escape')
  // Filter chips: on tablets and desktops every chip is fully visible (the row wraps); phones swipe a single row.
  const chipsCut = async () => p.evaluate(() => [...document.querySelectorAll('.chip-row.filter-chips')].filter((r) => r.offsetParent).some((r) => r.scrollWidth > r.clientWidth + 1))
  await go('Brokerage'); await audit('brokerage')
  if (tag !== 'mob') ok(!(await chipsCut()), `${tag}: Brokerage filter chips all visible, none cut off`)
  await go('Audit log'); if (tag !== 'mob') ok(!(await chipsCut()), `${tag}: Audit log type chips all visible, none cut off`)
  await go('Brokerage')
  await p.click('.booking-main >> nth=0'); await p.waitForTimeout(400); await audit('brokerage-detail')
  await p.click('.booking-detail-actions .btn:has-text("Send reminder")'); await p.waitForTimeout(400); await audit('brokerage-reminder')
  ok(errs.length === 0, `${tag}: no console errors ${errs.join(' | ')}`); await p.close()
}
await b.close()
