/**
 * @param {HTMLElement} rootEl
 */
export class FullscreenController {
  /** @type {HTMLElement} */
  #rootEl

  /** @type {() => void} */
  #onChange

  /** @type {() => void} */
  #onFullscreenChange

  /**
   * @param {HTMLElement} rootEl
   * @param {() => void} [onChange]
   */
  constructor(rootEl, onChange) {
    this.#rootEl = rootEl
    this.#onChange = onChange ?? (() => {})

    this.#onFullscreenChange = () => {
      this.#rootEl.classList.toggle('bonsai-editor--fullscreen', this.isFullscreen)
      this.#onChange()
    }

    document.addEventListener('fullscreenchange', this.#onFullscreenChange)
  }

  get isSupported() {
    return typeof document !== 'undefined' && Boolean(document.fullscreenEnabled)
  }

  get isFullscreen() {
    return document.fullscreenElement === this.#rootEl
  }

  /**
   * @returns {Promise<boolean>}
   */
  async toggle() {
    if (!this.isSupported) return false
    try {
      if (this.isFullscreen) {
        await document.exitFullscreen()
      } else {
        await this.#rootEl.requestFullscreen()
      }
      return true
    } catch {
      return false
    }
  }

  destroy() {
    document.removeEventListener('fullscreenchange', this.#onFullscreenChange)
    if (this.isFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
    this.#rootEl.classList.remove('bonsai-editor--fullscreen')
  }
}
