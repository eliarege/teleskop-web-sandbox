<script setup lang="ts">
import { isNaN } from 'lodash-es'
import type { QInput } from 'quasar'

const props = withDefaults(defineProps<{
  hideArrows?: boolean
  type?: 'decimal' | 'integer' | 'positive-integer' | 'negative-integer'
}>(), {
  hideArrows: true,
  type: 'decimal',
})

const model = defineModel<number>()
const editor = useEditorStore()
const id = useId()
const input = ref<QInput>()

watch(() => input.value?.hasError, (value) => {
  if (value) {
    editor.errorIds.add(id)
  } else {
    editor.errorIds.delete(id)
  }
})

onUnmounted(() => {
  editor.errorIds.delete(id)
})

function onKeydownPreventNonNumerical(event: KeyboardEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  const value = event.target.value

  if (props.type === 'positive-integer' && event.key === '-') {
    return event.preventDefault()
  }

  if (event.key === '-') {
    if (value.includes('-') || event.target.selectionStart !== 0) {
      return event.preventDefault()
    }
  }

  if (/[\d.-]/.test(event.key)) {
    if (value.includes('-') && event.target.selectionStart === 0 && value.includes('.')) {
      return event.preventDefault()
    }
  }

  if (props.type === 'integer' && event.key === '.') {
    return event.preventDefault()
  }

  if (!event.ctrlKey && event.key.length === 1 && !/[\d.-]/.test(event.key)) {
    return event.preventDefault()
  }

  if (props.type === 'decimal' && event.key === '.') {
    if (value.includes('.')) {
      return event.preventDefault()
    }
  }

  if (event.key === '0' && value === '0') {
    return event.preventDefault()
  } else if (value.length === 1 && value[0] === '0' && event.key !== '.' && event.key !== 'Backspace') {
    event.target.value = ''
  }
}

function onPastePreventNonNumerical(event: ClipboardEvent) {
  if (!event.clipboardData)
    return

  if (!event.clipboardData.types.includes('text/plain')) {
    return event.preventDefault()
  }

  const data = event.clipboardData.getData('text/plain')
  if (!/^[\d.]+$/.test(data)) {
    return event.preventDefault()
  }

  if (props.type === 'decimal' && (data.indexOf('.') !== data.lastIndexOf('.')))
    return event.preventDefault()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
}

function onBlur(event: FocusEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  let value = event.target.value
  if (props.type === 'decimal') {
    if (value.startsWith('.')) {
      value = `0${value}`
    }

    if (value.startsWith('-.')) {
      value = `-0${value.substring(1)}`
    }

    if (value === '-') {
      value = ''
    }

    const parsedValue = Number.parseFloat(value)
    if (!isNaN(parsedValue)) {
      model.value = parsedValue
    }

    event.target.value = value
  }
  input.value?.validate()
}
</script>

<template>
  <QField
    ref="input"
    v-model="model"
    class="input-number"
    :class="{ 'hide-arrows': hideArrows }"
    :for="id"
    bottom-slots
    no-error-icon
    hide-bottom-space
    outlined
    dense
  >
    <template #control="{ id }">
      <input
        :id="id"
        v-model="model"
        type="text"
        class="q-field__native q-placeholder"
        @keydown="onKeydownPreventNonNumerical"
        @paste="onPastePreventNonNumerical"
        @drop="onDrop"
        @blur="onBlur"
      >
    </template>
  </QField>
</template>

<style lang="postcss">
.input-number.hide-arrows  {
  /* Chrome, Safari, Edge, Opera */
  & input::-webkit-outer-spin-button,
  & input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  & input[type=number] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
}
</style>
