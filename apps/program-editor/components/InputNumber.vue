<script setup lang="ts">
import type { QInput } from 'quasar'
import type { PropType } from 'vue'

const props = defineProps({
  type: String as PropType<'decimal' | 'integer' | 'positive-integer'>,
  rules: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  maxlength: {
    type: Number,
    default: 10,
  },
  outlined: Boolean,
  dense: Boolean,
  decimals: {
    type: [Number, null],
    default: null,
    validator(value) {
      return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0)
    },
  },
  hideBottomSpace: Boolean,
  format: {
    type: String,
    default: '',
  },
  disable: Boolean,
  maybeEmpty: Boolean,
  id: String,
  label: String,
  autofocus: Boolean,
})

const emit = defineEmits(['inputBlur'])

const model = defineModel<number>()
const editor = useEditorStore()
const id = props.id || useId()
const input = ref<QInput>()
const numberInput = ref<HTMLElement | null>(null)

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
      return props.decimals === 0 ? INTEGER_RE : DECIMAL_RE
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
  if (!(event.ctrlKey || event.metaKey) && event.key.length === 1 && !isValidChar) {
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

  // Ondalık basamak sayısını kontrol et
  if (props.decimals !== null && props.decimals > 0 && isValidChar && event.key !== '.' && event.key !== '-') {
    const dotIndex = value.indexOf('.')
    if (dotIndex !== -1) {
      const decimalPart = value.slice(dotIndex + 1)
      const cursorPosition = event.target.selectionStart!
      const cursorAfterDot = cursorPosition > dotIndex

      if (cursorAfterDot && decimalPart.length >= props.decimals) {
        return event.preventDefault()
      }
    }
  }
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
    const newValue = input.value.slice(0, input.selectionStart!) + text + input.value.slice(input.selectionEnd!)

    // Ondalık basamak sayısını kontrol et
    if (props.decimals !== null && props.decimals > 0) {
      const dotIndex = newValue.indexOf('.')
      if (dotIndex !== -1) {
        const decimalPart = newValue.slice(dotIndex + 1)
        if (decimalPart.length > props.decimals) {
          // Ondalık basamak sayısını sınırla
          input.value = newValue.slice(0, dotIndex + 1) + decimalPart.slice(0, props.decimals)
          return
        }
      }
    }

    input.value = newValue
  }

  handlePaste(data)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
}

function onBlurInternal(event: FocusEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  let value = event.target.value

  if (props.maybeEmpty && value === '') {
    model.value = undefined
    emit('inputBlur', event)
    return
  }

  if (value.startsWith('.')) {
    value = `0${value}`
  }

  if (value.startsWith('-.')) {
    value = `-0${value.substring(1)}`
  }

  if (value === '-') {
    value = ''
  }

  // Ondalık basamak sayısını sınırla
  if (props.decimals !== null && props.decimals > 0 && value.includes('.')) {
    const [integerPart, decimalPart] = value.split('.')
    if (decimalPart && decimalPart.length > props.decimals) {
      value = `${integerPart}.${decimalPart.slice(0, props.decimals)}`
    }
  }

  const parsedValue = Number.parseFloat(value)
  if (!Number.isNaN(parsedValue)) {
    model.value = parsedValue
  }

  event.target.value = value

  input.value?.validate()
  emit('inputBlur', event)
}

const IGNORE_RE = /^(\.|-|-\.)?$/

function onInput(event: Event) {
  const { value } = event.target as HTMLInputElement
  if (value === '' && props.maybeEmpty) {
    model.value = undefined
  } else if (!IGNORE_RE.test(value)) {
    model.value = Number.parseFloat(value)
  }
}

defineExpose({
  focus() {
    numberInput.value?.focus()
  },
})

onMounted(() => {
  if (props.autofocus) {
    nextTick(() => {
      numberInput.value?.focus()
    })
  }
})
</script>

<template>
  <QField
    ref="input"
    :model-value="model"
    class="input-number"
    :for="id"
    :rules="rules"
    bottom-slots
    no-error-icon
    :hide-bottom-space="hideBottomSpace"
    :outlined="outlined"
    :disable="disable"
    :dense="dense"
    :label="label"
    :suffix="format === 'DURATION' ? 'min' : ''"
  >
    <template #control="{ id: inputId }">
      <input
        :id="inputId"
        ref="numberInput"
        :value="model"
        type="text"
        :maxlength="maxlength"
        autocomplete="off"
        class="q-field__native q-placeholder"
        :class="format === 'DURATION' ? 'text-right' : ''"
        :disabled="disable"
        :autofocus="autofocus"
        @keydown="onKeydownPreventNonNumerical"
        @paste="onPastePreventNonNumerical"
        @drop="onDrop"
        @input="onInput"
        @blur="onBlurInternal"
      >
    </template>
    <template #append>
      <slot name="optimized" />
    </template>
  </QField>
</template>

<style lang="postcss">
.input-number.hide-arrows {
  /* Chrome, Safari, Edge, Opera */
  & input::-webkit-outer-spin-button,
  & input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  & input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
}
/*
  When there are no labels sent to `QField`, for some reason there is a odd padding despite `QField` dense.
  This is a workaround to remove it.
*/
.input-number .q-field__native {
  padding: 0;
}
</style>
