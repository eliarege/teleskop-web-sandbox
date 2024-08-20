<script setup lang="ts">
import type { ModelRef } from 'vue'
import type { QField } from 'quasar'

defineProps<{
  label?: string
  rules?: Array<any>
  outlined?: boolean
  dense?: boolean
  filled?: boolean
  clearable?: boolean
}>()
const model: ModelRef<number | undefined, string> = defineModel()
const id = useId()
const editor = useEditorStore()
const input = ref<QField>()

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
</script>

<template>
  <QField
    v-model="model"
    :dense
    :clearable
    :label
    :for="id"
    :filled
    :outlined
    :rules
  >
    <template #control>
      <InputDurationRaw :id="id" v-model="model" />
    </template>
    <template #append>
      <slot name="optimized" />
    </template>
  </QField>
</template>
