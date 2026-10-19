import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const pkg = require(join(root, 'package.json'))

const requiredFiles = [
  pkg.main,
  pkg.module,
  pkg.types,
  pkg.unpkg,
  pkg.exports['.'].import,
  pkg.exports['.'].require,
  pkg.exports['./element'].import,
  pkg.exports['./vue'].import,
  pkg.exports['./standalone'],
  pkg.exports['./style.css'],
].map((p) => join(root, p))

let failed = false

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error('Missing build artifact:', file.replace(root + '/', ''))
    failed = true
  }
}

const coreJs = readFileSync(join(root, 'dist/bonsai-editor.js'), 'utf8')
if (/\bvue\b/i.test(coreJs) && /from ['"]vue['"]/.test(coreJs)) {
  console.error('Core bundle must not import vue')
  failed = true
}

const coreCss = readFileSync(join(root, 'dist/bonsai-editor.css'), 'utf8')
if (!coreCss.includes('[data-resize-handle]')) {
  console.error('dist/bonsai-editor.css is missing resizable image styles (run npm run build)')
  failed = true
}
if (!coreJs.includes('alwaysPreserveAspectRatio')) {
  console.error('dist/bonsai-editor.js is missing image resize config (run npm run build)')
  failed = true
}

try {
  execSync('npm pack --dry-run', { cwd: root, stdio: 'pipe' })
} catch (e) {
  console.error('npm pack --dry-run failed')
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log('Package verification passed.')
