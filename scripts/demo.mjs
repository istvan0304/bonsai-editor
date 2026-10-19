import { spawn } from 'node:child_process'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = 4173
const url = `http://localhost:${port}/demo/static.html`

/**
 * @param {string} target
 */
function openBrowser(target) {
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', target], () => {})
    return
  }
  if (process.platform === 'darwin') {
    execFile('open', [target], () => {})
    return
  }
  execFile('xdg-open', [target], () => {})
}

const serve = spawn(
  'npx',
  ['--yes', 'serve', '-l', `tcp://127.0.0.1:${port}`, '.', '--no-clipboard'],
  {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  },
)

serve.on('error', (err) => {
  console.error(err)
  process.exit(1)
})

setTimeout(() => {
  console.log(`\nDemó: ${url}\n`)
  openBrowser(url)
}, 600)

serve.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 0)
})
