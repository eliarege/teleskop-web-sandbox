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

const emit = defineEmits<{
  inputBlur: []
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

onMounted(() => {
  input.value?.validate()
})

function handleBlur() {
  input.value?.validate()
  emit('inputBlur')
}
</script>

<template>
  <QField
    ref="input"
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
      <InputDurationRaw
        :id="id"
        v-model="model"
        @blur="handleBlur"
      />
    </template>
    <template #append>
      <slot name="optimized" />
    </template>
  </QField>
</template>
