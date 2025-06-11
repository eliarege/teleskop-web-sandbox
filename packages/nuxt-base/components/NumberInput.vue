<script setup lang="ts">
const props = withDefaults(defineProps<{
  hideArrows?: boolean
  integer?: boolean
}>(), {
  hideArrows: true,
  integer: false,
})
const model = defineModel()
function onKeydownPreventNonNumerical(event: KeyboardEvent) {
  if (!event.ctrlKey && event.key.length === 1 && !/[\d.]/.test(event.key)) {
    return event.preventDefault()
  }

  if (props.integer && event.key === '.') {
    return event.preventDefault()
  }
  removeLeadingZeros(event)
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

function removeLeadingZeros(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement
  if (event.key === '0' && target.value === '0') {
    return event.preventDefault()
  } else if (target.value.length === 1 && target.value[0] === '0') {
    target.value = ''
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <q-input
    v-model="model"
    class="input-number"
    :class="{ 'hide-arrows': hideArrows, 'integer': integer }"
    type="number"
    @keydown="onKeydownPreventNonNumerical"
    @paste="onPastePreventNonNumerical"
    @drop="onDrop"
  />
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
</style>
