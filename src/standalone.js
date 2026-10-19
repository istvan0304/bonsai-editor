import { BonsaiEditor as CoreBonsaiEditor } from './core/editor.js'
import themeCss from './core/theme.css?inline'
import { defineBonsaiElement } from './element/bonsai-editor-element.js'

defineBonsaiElement()

export default class BonsaiEditor extends CoreBonsaiEditor {
  /**
   * @param {import('./core/editor.js').BonsaiEditorOptions} [options]
   */
  constructor(options = {}) {
    super({
      injectStyles: options.injectStyles ?? true,
      injectStylesCss: themeCss,
      ...options,
    })
  }
}
