/**
 * Mammoth UMD böngésző csomag – a Node „mammoth” belépési pont Vite alatt nem tölthető be.
 * @typedef {typeof import('mammoth')} MammothModule
 */

/** @type {MammothModule} */
// @ts-expect-error UMD bundle, nincs ESM típus
import mammoth from 'mammoth/mammoth.browser.js'

export default mammoth
