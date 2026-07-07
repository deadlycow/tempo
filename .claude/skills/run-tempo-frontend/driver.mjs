// REPL driver for tempo-frontend, using Playwright's chromium (chromium-cli
// wasn't available in this environment, so this is a minimal stand-in with
// the same shape). Run headless against the vite dev server.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
import { chromium } from 'playwright'
import * as readline from 'node:readline'
import * as fs from 'node:fs'
import * as path from 'node:path'

const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots'
fs.mkdirSync(SHOT_DIR, { recursive: true })
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080'

let browser = null
let page = null

const COMMANDS = {
  async launch() {
    if (browser) return console.log('already launched')
    browser = await chromium.launch({ args: ['--no-sandbox'] })
    const context = await browser.newContext()
    page = await context.newPage()
    console.log('launched.')
  },

  async nav(url) {
    if (!page) return console.log('ERROR: launch first')
    const target = /^https?:\/\//.test(url) ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
    await page.goto(target, { waitUntil: 'domcontentloaded' })
    console.log('nav ->', target)
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first')
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png')
    await page.screenshot({ path: f, fullPage: true })
    console.log('screenshot:', f)
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first')
    try { await page.click(sel, { timeout: 10_000 }); console.log('click', sel, '-> OK') }
    catch (e) { console.log('click', sel, '-> ERROR:', e.message.split('\n')[0]) }
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first')
    try {
      await page.getByText(text, { exact: false }).first().click({ timeout: 10_000 })
      console.log('click-text', JSON.stringify(text), '-> OK')
    } catch (e) { console.log('click-text', JSON.stringify(text), '-> ERROR:', e.message.split('\n')[0]) }
  },

  async fill(args) {
    if (!page) return console.log('ERROR: launch first')
    const sp = args.indexOf(' ')
    const sel = args.slice(0, sp)
    const value = args.slice(sp + 1)
    try { await page.fill(sel, value); console.log('fill', sel, '-> OK') }
    catch (e) { console.log('fill', sel, '-> ERROR:', e.message.split('\n')[0]) }
  },

  async type(text) { if (page) await page.keyboard.type(text, { delay: 20 }) },
  async press(key) { if (page) await page.keyboard.press(key) },

  async 'wait-for'(sel) {
    if (!page) return console.log('ERROR: launch first')
    try { await page.waitForSelector(sel, { timeout: 15_000 }); console.log('found:', sel) }
    catch { console.log('TIMEOUT:', sel) }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first')
    try { console.log(JSON.stringify(await page.evaluate(expr))) }
    catch (e) { console.log('ERROR:', e.message) }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first')
    console.log(await page.evaluate(
      s => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null))
  },

  async url() { if (page) console.log(page.url()) },

  async 'console-errors'() {
    console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)')
  },

  async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')) },
}

const consoleErrors = []
function attachConsole(p) {
  p.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  p.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message))
}
const origLaunch = COMMANDS.launch
COMMANDS.launch = async function () {
  await origLaunch()
  if (page) attachConsole(page)
}

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') })
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' })

// Piped stdin (heredoc) delivers every line before the first async command
// resolves, so a naive `rl.on('line', async ...)` runs commands concurrently
// (e.g. "nav" starts before "launch" finishes). Queue and run one at a time.
let queue = Promise.resolve()
let closed = false
rl.on('line', line => {
  queue = queue.then(async () => {
    const cmd = line.trim().split(/\s+/)[0]
    const rest = line.trim().slice(cmd.length).trim()
    if (!cmd) return
    const fn = COMMANDS[cmd]
    if (!fn) return console.log('unknown:', cmd, '- try: help')
    try { await fn(rest) } catch (e) { console.log('ERROR:', e.message) }
    if (!closed) rl.prompt()
  })
})
rl.on('close', () => {
  closed = true
  queue = queue.then(async () => { await COMMANDS.quit(); process.exit(0) })
})

console.log('tempo-frontend driver - "help" for commands, "launch" to start')
rl.prompt()
