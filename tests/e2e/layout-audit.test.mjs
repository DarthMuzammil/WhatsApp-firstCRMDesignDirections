import { chromium } from 'playwright-core'
import { BASE_URL, SHOTS } from './helpers.mjs'
import fs from 'node:fs'
const b = await chromium.launch()
const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m)
// Walks every main flow at desktop, tablet and phone sizes and checks each screen for: text under 11 px,
// elements sticking out sideways, sideways scrolling, phone tap targets under 36 px, and console errors.
const out = SHOTS
for (const [tag, w, h] of [['desk', 1440, 900], ['tab', 900, 1000], ['mob', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  const errs = []
  p.on('console', m => m.type() === 'error' && errs.push(m.text()))
  p.on('pageerror', e => errs.push(e.message))
  await p.goto(BASE_URL); await p.waitForTimeout(1500)
  const audit = async (name) => {
    await p.waitForTimeout(450)
    const r = await p.evaluate((isMob) => {
      const W = document.documentElement.clientWidth
      const small = [], taps = [], over = []
      for (const e of document.querySelectorAll('body *')) {
        const rect = e.getBoundingClientRect(); if (!rect.width) continue
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue
        if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { const f = parseFloat(cs.fontSize); if (f < 11 && f > 0) small.push(f + ':' + e.textContent.trim().slice(0, 20)) }
        if (rect.right > W + 1 && !e.closest('.stage-tabs,.locality-chips,.quick-replies,.permissions-table')) over.push((e.className || e.tagName).toString().slice(0, 30))
        // An input inside a bigger box (search field, phone field, composer) is tapped through that box.
        const box = e.tagName === 'INPUT' ? e.parentElement.getBoundingClientRect() : rect
        if (isMob && (e.tagName === 'BUTTON' || e.tagName === 'INPUT' || e.tagName === 'SELECT') && (box.height < 36 || box.width < 36)) taps.push((e.getAttribute('aria-label') || e.textContent.trim() || e.className).slice(0, 22) + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height))
      }
      return { small: small.slice(0, 8), taps: [...new Set(taps)].slice(0, 10), over: [...new Set(over)].slice(0, 6), hscroll: document.documentElement.scrollWidth > W }
    }, tag === 'mob')
    ok(!r.small.length && !r.taps.length && !r.over.length && !r.hscroll, `${tag} ${name}: layout clean${r.small.length || r.taps.length || r.over.length || r.hscroll ? ' ' + JSON.stringify(r) : ''}`)
    await p.screenshot({ path: `${out}/${tag}-${name}.png` })
  }
  const nav = async (label) => {
    const l = p.locator(`.sidebar-nav button:has-text("${label}"):visible, .mobile-tab-bar button:has-text("${label}"):visible`).first()
    if (await l.count()) { await l.click(); return }
    await p.click('.mobile-tab-bar button:has-text("More")'); await p.click(`.more-sheet button:has-text("${label}")`)
  }
  const L = (o) => tag === 'mob' ? o.m : o.d
  await audit('home')
  await p.locator('.lead-row:has-text("Gaurav")').click(); await audit('chat')
  await p.locator('.quick-replies button').first().click(); await p.locator('.send-button').click()
  await p.locator(tag === 'mob' ? '.chat-mobile-actions button:nth-child(2)' : '.lead-detail-actions button:nth-child(2)').click(); await audit('schedule-visit')
  await p.locator('.add-lead .add-lead-submit').click(); await audit('chat-after')
  await nav('Pipeline'); await audit('pipeline')
  if (tag === 'mob') { await p.locator('.stage-tabs button').nth(1).click(); await audit('pipeline-stage1') }
  if (tag === 'desk') await p.locator('.pipeline-stage[aria-label="New lead"] .deal-card').first().dragTo(p.locator('.pipeline-stage[aria-label="Qualified"]'))
  else await p.locator('.pipeline-stage.phone-visible .deal-advance, .deal-advance:visible').first().click()
  await audit('pipeline-moved')
  await nav('Properties'); await audit('properties')
  await nav(L({ d: 'Follow-ups', m: 'Tasks' })); await p.locator('.task-check').first().click(); await audit('tasks')
  await nav('Calls'); await audit('calls')
  await p.locator('.page-head .btn-primary').click(); await audit('picker')
  await p.locator('.contact-list button').first().click(); await p.waitForTimeout(2600); await audit('call')
  await p.locator('.end-call').click(); await audit('call-ended')
  await p.locator('.call-ended button').click(); await audit('calls-saved')
  await nav(L({ d: 'Today', m: 'Inbox' }))
  await p.locator('.sidebar-add:visible, .mobile-add:visible').first().click(); await audit('modal')
  await p.fill('.add-lead input[placeholder="e.g. Priya Menon"]', 'Priya Menon'); await p.fill('.add-lead .phone-input input', '9876543210'); await p.fill('.add-lead input[placeholder="e.g. Koramangala"]', 'Koramangala')
  await p.locator('.add-lead-submit').click(); await audit('modal-saved')
  await p.locator('.add-lead .btn-primary').click(); await audit('home-after')
  await p.locator('.lead-row').first().click(); await audit('chat-newlead')
  await p.locator('.account-menu-trigger:visible').first().click(); await audit('menu')
  await p.locator('.account-menu-popover button:has-text("Reset demo data")').click(); await audit('reset-confirm'); await p.locator('.confirm-dialog .btn-danger').click(); await p.waitForTimeout(1500); await audit('after-reset')
  ok(errs.length === 0, `${tag}: no console errors ${errs.join(' | ')}`)
  await p.close()
}
await b.close()
