import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
// A screen's file failing to download (weak signal) must never blank the app (spec §6, §7).
const b = await chromium.launch()
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m)
// Matches the Performance screen's code in dev (/src/views/ReportsView.tsx) and in a build (ReportsView-<hash>.js).
const SCREEN = /ReportsView(-[\w-]+)?\.(tsx|js)(\?.*)?$/
for (const [tag, w, h] of [['desk', 1440, 900], ['mob', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  const crashes = []
  p.on('pageerror', (e) => crashes.push(e.message))
  let block = false
  await p.route(SCREEN, (route) => (block ? route.abort() : route.continue()))
  const open = async (label) => {
    const direct = p.locator(`.sidebar-nav button:has-text("${label}"):visible, .mobile-tab-bar button:has-text("${label}"):visible`).first()
    if (await direct.count()) { await direct.click(); return }
    await p.click('.mobile-tab-bar button:has-text("More")'); await p.click(`.more-sheet button:has-text("${label}")`)
  }
  await p.goto(BASE_URL); await p.evaluate(() => localStorage.clear())
  // 1. The background download fails (signal drops just after opening), then the signal is back.
  block = true; await p.reload(); await p.waitForTimeout(1500); block = false
  await open('Performance')
  await p.waitForSelector('.reports-view h1', { timeout: 8000 }).catch(() => {})
  ok(await p.locator('.reports-view h1').count() === 1, `${tag}: a screen whose background download failed loads when opened`)
  // 2. Still offline when the screen is opened: an in-app message, navigation intact, Try again recovers.
  block = true; await p.reload(); await p.waitForTimeout(1500)
  await open('Performance')
  await p.waitForSelector('.screen-error', { timeout: 8000 }).catch(() => {})
  ok(await p.locator('.screen-error h3').innerText().catch(() => '') === 'Couldn’t load this screen', `${tag}: offline → "Couldn’t load this screen", not a blank page`)
  ok(await p.locator('.sidebar-nav:visible, .mobile-tab-bar:visible').count() === 1, `${tag}: navigation still works while the screen failed`)
  await p.screenshot({ path: `${SHOTS}/resilience-${tag}-error.png` })
  block = false
  await p.click('.screen-error .btn:has-text("Try again")')
  await p.waitForSelector('.reports-view h1', { timeout: 8000 }).catch(() => {})
  ok(await p.locator('.reports-view h1').count() === 1 && await p.locator('.screen-error').count() === 0, `${tag}: Try again loads the screen once the signal is back`)
  await open('Today'); await p.waitForTimeout(300)
  ok(await p.locator('.today-view').count() === 1, `${tag}: other screens unaffected`)
  ok(crashes.length === 0, `${tag}: no uncaught errors ${crashes.join(' | ')}`)
  await p.close()
}
await b.close()
