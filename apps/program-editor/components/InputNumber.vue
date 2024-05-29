<script setup lang="ts">
import { isNaN } from 'lodash-es'
import type { QInput } from 'quasar'

const props = withDefaults(defineProps<{
  hideArrows?: boolean
  type?: 'decimal' | 'integer' | 'positive-integer'
  rules: any
  maxlength?: number
  outlined?: boolean
  dense?: boolean
  hideBottomSpace?: boolean
}>(), {
  hideArrows: true,
  type: 'decimal',
  rules: () => [],
  maxlength: 10,
  outlined: false,
  dense: false,
  hideBottomSpace: false,
})

const model = defineModel<number>()
const editor = useEditorStore()
const id = useId()
const input = ref<QInput>()

const DECIMAL_RE = /[\d.-]/
const INTEGER_RE = /[\d-]/
const POSITIVE_INTEGER_RE = /\d/

const charRe = computed(() => {
  switch (props.type) {
    case 'integer':
      return INTEGER_RE
    case 'positive-integer':
      return POSITIVE_INTEGER_RE
    default:
      return DECIMAL_RE
  }
})

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

function getValueOutsideSelection(input: HTMLInputElement) {
  if (input.selectionStart !== null && input.selectionEnd !== null) {
    return input.value.slice(0, input.selectionStart) + input.value.slice(input.selectionEnd)
  } else {
    return input.value
  }
}

function onKeydownPreventNonNumerical(event: KeyboardEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }
  const isValidChar = charRe.value.test(event.key)

  // Kullanıcı geçerli bir karaktere bastı mı
  if (!event.ctrlKey && event.key.length === 1 && !isValidChar) {
    return event.preventDefault()
  }

  // Kullanıcı tarafından seçilen alanın dışındaki text'i al
  const value = getValueOutsideSelection(event.target)

  // Sadece başa eksi yazılabilir, eksi varsa bir daha eksi yazılamaz
  if (event.key === '-' && (value.includes('-') || event.target.selectionStart !== 0)) {
    return event.preventDefault()
  }

  // Eksiden önce karakter gelemez
  if (isValidChar && value.includes('-') && event.target.selectionStart === 0) {
    return event.preventDefault()
  }

  // Nokta varsa yeniden ekleme
  if (event.key === '.' && value.includes('.')) {
    return event.preventDefault()
  }

  // if (event.key === '0' && value.length && event.target.selectionStart === 0) {
  //   return event.preventDefault()
  // }

  // if (value === '0' && event.key !== '.') {
  //   event.target.value = ''
  // }
}

function onPastePreventNonNumerical(event: ClipboardEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  if (!event.clipboardData)
    return

  if (!event.clipboardData.types.includes('text/plain')) {
    return event.preventDefault()
  }

  const data = event.clipboardData.getData('text/plain')
  const input = event.target

  const handlePaste = (text: string) => {
    event.preventDefault()
    input.value = input.value.slice(0, input.selectionStart!) + text + input.value.slice(input.selectionEnd!)
  }

  handlePaste(data)
  //   const value = input.value
  //   const hasMinus = value.includes('-')
  //   const hasDot = value.includes('.')
  //   if (hasMinus)
  //     text.replaceAll('-', '')
  //   if (hasDot)
  //     text.replaceAll('.', '')

  // if (!/^[\d.]+$/.test(data)) {
  //   return event.preventDefault()
  // }

  // if (props.type === 'decimal' && (data.indexOf('.') !== data.lastIndexOf('.')))
  //   return event.preventDefault()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
}

function onBlur(event: FocusEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  let value = event.target.value
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
    :rules="rules"
    bottom-slots
    no-error-icon
    :hide-bottom-space="hideBottomSpace"
    :outlined="outlined"
    :dense="dense"
  >
    <template #control="{ id }">
      <input
        :id="id"
        v-model="model"
        type="text"
        :maxlength="maxlength"
        autocomplete="off"
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
