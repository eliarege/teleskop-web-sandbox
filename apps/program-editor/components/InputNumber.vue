<script setup lang="ts">
import type { QInput } from 'quasar'

const props = withDefaults(defineProps<{
  label: string
  minValue: number
  maxValue: number
  hideArrows?: boolean
  integer?: boolean
}>(), {
  hideArrows: true,
  integer: false,
})

const model = defineModel<number>()
const editor = useEditorStore()
const id = useId()
const { t } = useI18n()
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

const rules = computed(() => {
  const errorMessage = t('valueOutOfRange', {
    minValue: props.minValue,
    maxValue: props.maxValue,
  })

  return [
    (v: string) => {
      const parsedValue = Number.parseInt(v)
      if (!Number.isNaN(parsedValue) && between(parsedValue, props.minValue, props.maxValue)) {
        return true
      } else {
        return errorMessage
      }
    },
  ]
})

function onKeydownPreventNonNumerical(event: KeyboardEvent) {
  if (!event.target || !(event.target instanceof HTMLInputElement)) {
    return
  }

  if (!event.ctrlKey && event.key.length === 1 && !/[\d.]/.test(event.key)) {
    return event.preventDefault()
  }

  if (props.integer && event.key === '.') {
    return event.preventDefault()
  }

  if (event.key === '0' && event.target.value === '0') {
    return event.preventDefault()
  } else if (event.target.value.length === 1 && event.target.value[0] === '0') {
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
  event.clipboardData.setData('text/plain', data.replace(/^0+([1-9])/, ''))

  if (!/^[\d.]+$/.test(data)) {
    return event.preventDefault()
  }

  if (props.integer && (data.indexOf('.') !== data.lastIndexOf('.')))
    return event.preventDefault()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <QField
    ref="input"
    v-model="model"
    class="input-number"
    :class="{ 'hide-arrows': hideArrows, 'integer': integer }"
    :for="id"
    type="number"
    :label="props.label"
    :rules="rules"
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
        class="q-field__native q-placeholder"
        :aria-label="props.label"
        maxlength="10"
        @keydown="onKeydownPreventNonNumerical"
        @paste="onPastePreventNonNumerical"
        @drop="onDrop"
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
