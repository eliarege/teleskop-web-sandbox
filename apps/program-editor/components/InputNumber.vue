<script setup lang="ts">
import type { QInput } from 'quasar'

const props = defineProps<{
  label: string
  minValue: number
  maxValue: number
}>()

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
</script>

<template>
  <QField
    ref="input"
    v-model="model"
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
      >
    </template>
  </QField>
</template>
