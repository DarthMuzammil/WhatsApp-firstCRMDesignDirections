// Runs every end-to-end check in a real (headless) Chromium against the demo.
//   pnpm test:e2e              all suites
//   pnpm test:e2e inventory    only suites whose file name contains "inventory"
//   BASE_URL=https://… pnpm test:e2e   against another copy (e.g. the live GitHub Pages site)
// Without BASE_URL it uses the dev server on port 5199, starting one if nothing is running there.
// Each suite prints PASS/FAIL lines; the run fails if any line is FAIL or a suite crashes.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const filter = process.argv[2] ?? ''
const suites = fs.readdirSync(here).filter((file) => file.endsWith('.test.mjs') && file.includes(filter)).sort()
let baseUrl = process.env.BASE_URL
let server

async function isUp(url) {
  try { return (await fetch(url)).ok } catch { return false }
}

if (!baseUrl) {
  baseUrl = 'http://localhost:5199'
  if (!(await isUp(baseUrl))) {
    console.log('Starting the dev server on port 5199…')
    server = spawn(path.join(root, 'node_modules/.bin/vite'), [], { cwd: root, env: { ...process.env, PORT: '5199' }, stdio: 'ignore' })
    for (let i = 0; i < 60 && !(await isUp(baseUrl)); i++) await new Promise((resolve) => setTimeout(resolve, 500))
    if (!(await isUp(baseUrl))) { console.error('The dev server did not start.'); server.kill(); process.exit(1) }
  }
}

// Open the app once and wait for its lazy screens to be prefetched (`<html data-screens="ready">`), so the dev
// server has transformed every chunk before the suites start clicking; otherwise the first visit to a lazy screen
// can take longer than a suite's fixed waits.
{
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    await page.goto(baseUrl)
    await page.waitForSelector('html[data-screens="ready"]', { timeout: 60000 })
  } catch (error) {
    console.log(`Warm-up did not finish: ${error.message.split('\n')[0]}`)
  }
  await browser.close()
}

function runSuite(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(here, file)], { env: { ...process.env, BASE_URL: baseUrl } })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    child.on('close', (code) => resolve({ output, code }))
  })
}

let failedSuites = 0
let checks = 0
const started = Date.now()
for (const file of suites) {
  const { output, code } = await runSuite(file)
  const lines = output.split('\n')
  const passed = lines.filter((line) => line.startsWith('PASS')).length
  const failed = lines.filter((line) => line.startsWith('FAIL'))
  checks += passed + failed.length
  const crashed = code !== 0
  if (failed.length || crashed) failedSuites++
  console.log(`${failed.length || crashed ? '✗' : '✓'} ${file.replace('.test.mjs', '')}: ${passed} passed${failed.length ? `, ${failed.length} failed` : ''}${crashed ? ' (crashed)' : ''}`)
  for (const line of failed) console.log(`    ${line}`)
  if (crashed) {
    console.log(output.trim().split('\n').slice(-6).map((line) => `    ${line}`).join('\n'))
    if (output.includes("Executable doesn't exist")) console.log('    Chromium is missing: run `pnpm exec playwright-core install chromium` once.')
  }
}
server?.kill()
console.log(`\n${suites.length - failedSuites}/${suites.length} suites passed · ${checks} checks · ${Math.round((Date.now() - started) / 1000)} s · screenshots in tests/e2e/screenshots/`)
process.exit(failedSuites ? 1 : 0)
