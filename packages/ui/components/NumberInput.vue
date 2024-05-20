<script setup lang="ts">
import type { QInputProps } from 'quasar'

const props = defineProps<{ config: QInputProps }>()
const emit = defineEmits(['update:config'])

function onKeydownPreventNonNumerical(event, val) {
  if (!event.ctrlKey && event.key.length === 1 && (!/[\d.]/.test(event.key) || val === '0' || (event.key === '.' && val.includes('.')))) {
    event.preventDefault()
  }
}

function onPastePreventNonNumerical(event) {
  if (!event.clipboardData.types.includes('text/plain')) {
    return event.preventDefault()
  }
  const data = event.clipboardData.getData('text/plain')
  if (!/^[\d.]+$/.test(data)) {
    return event.preventDefault()
  }
  if ((data.indexOf('.') !== data.lastIndexOf('.')))
    return event.preventDefault()
}

function onDrop(event) {
  event.preventDefault()
}

// import type { QInputProps } from 'quasar'
// import { NumberInput } from 'ui'

// const config = ref({
//   modelValue: 1,
// } as QInputProps)
</script>
<!--
<template>
  <NumberInput :config="config" @update:config="c => config = c" />
</template> -->

<template>
  <div>
    <q-input
      v-bind="config"
      type="number"
      :min="0"
      @keydown="(e) => onKeydownPreventNonNumerical(e, config.modelValue)"
      @paste="onPastePreventNonNumerical"
      @drop="onDrop"
      @update:model-value="emit('update:config', config)"
    />
  </div>
</template>
