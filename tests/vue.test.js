import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { BonsaiVueEditor } from '../src/wrappers/vue/BonsaiVueEditor.js'

afterEach(() => {
  document.body.innerHTML = ''
})

/**
 * @param {import('@vue/test-utils').VueWrapper} wrapper
 */
function getEditorFromReady(wrapper) {
  const ready = wrapper.emitted('ready')
  expect(ready).toBeTruthy()
  return /** @type {import('../src/core/editor.js').BonsaiEditor} */ (ready[0][0])
}

describe('BonsaiVueEditor', () => {
  it('mounts and emits ready', async () => {
    const wrapper = mount(BonsaiVueEditor, {
      props: { modelValue: '<p>Vue</p>' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(getEditorFromReady(wrapper)).toBeTruthy()
    wrapper.unmount()
  })

  it('v-model html: propagates updates', async () => {
    let model = '<p>A</p>'
    const wrapper = mount(BonsaiVueEditor, {
      props: {
        modelValue: model,
        'onUpdate:modelValue': (v) => {
          model = v
          wrapper.setProps({ modelValue: v })
        },
      },
      attachTo: document.body,
    })
    await flushPromises()

    const editor = getEditorFromReady(wrapper)
    editor.setContent('<p>B</p>', { emitUpdate: true })
    await nextTick()
    expect(model).toContain('B')
    wrapper.unmount()
  })

  it('v-model json mode', async () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'J' }] }] }
    const wrapper = mount(BonsaiVueEditor, {
      props: {
        modelValue: doc,
        outputFormat: 'json',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const editor = getEditorFromReady(wrapper)
    expect(editor.getValue().type).toBe('doc')
    wrapper.unmount()
  })
})
