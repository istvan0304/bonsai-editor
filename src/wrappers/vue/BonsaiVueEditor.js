import { defineComponent, h, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BonsaiEditor } from '../../core/editor.js'
import { valuesEqual } from '../../core/output.js'

export const BonsaiVueEditor = defineComponent({
  name: 'BonsaiVueEditor',
  props: {
    modelValue: {
      type: [String, Object],
      default: '',
    },
    outputFormat: {
      type: String,
      default: 'html',
      validator: (v) => v === 'html' || v === 'json',
    },
    editable: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    toolbar: {
      type: [Boolean, Array, Object],
      default: false,
    },
    menubar: {
      type: [Boolean, Array, Object],
      default: false,
    },
    features: {
      type: Object,
      default: () => ({}),
    },
    extensions: {
      type: Array,
      default: () => [],
    },
    ariaLabel: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'focus', 'blur', 'ready'],
  setup(props, { emit, expose }) {
    const host = ref(null)
    /** @type {import('vue').Ref<BonsaiEditor | null>} */
    const editor = ref(null)

    onMounted(() => {
      if (!host.value) return

      editor.value = markRaw(
        new BonsaiEditor({
        element: host.value,
        content: props.modelValue,
        outputFormat: props.outputFormat,
        editable: props.editable,
        placeholder: props.placeholder,
        toolbar: props.toolbar,
        menubar: props.menubar,
        features: props.features,
        extensions: props.extensions,
        ariaLabel: props.ariaLabel || undefined,
        onUpdate: (value) => emit('update:modelValue', value),
        onFocus: (event) => emit('focus', event),
        onBlur: (event) => emit('blur', event),
        }),
      )

      emit('ready', editor.value)
    })

    watch(
      () => props.modelValue,
      (next) => {
        if (!editor.value) return
        const current = editor.value.getValue()
        if (valuesEqual(current, next)) return
        editor.value.setContent(next ?? '', { emitUpdate: false })
      },
    )

    watch(
      () => props.editable,
      (next) => editor.value?.setEditable(next),
    )

    watch(
      () => props.outputFormat,
      (next) => {
        if (editor.value) editor.value.outputFormat = next
      },
    )

    onBeforeUnmount(() => {
      editor.value?.destroy()
      editor.value = null
    })

    expose({ editor })

    return () => h('div', { ref: host, class: 'bonsai-vue-editor-host' })
  },
})
