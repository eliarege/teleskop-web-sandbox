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

// function encode(value: ParameterItem) {
//   if (!value)
//     return 0
//   return (value.value / 60)
// }

// function decode(value: number) {
//   return (value * 60)
// }

const rules = [
  (value: number) => {
    if (
      !Number.isNaN(value) && between(
        value,
        props.minValue,
        props.maxValue,
      )
    ) {
      return true
    } else {
      return t('valueOutOfRange', {
        minValue: props.minValue,
        maxValue: props.maxValue,
      })
    }
  },
]
</script>

<template>
  <QInput
    ref="input"
    v-model="model"
    :for="id"
    :label="props.label"
    :rules="rules"
    hide-bottom-space
    outlined
    dense
    suffix="min"
    input-class="text-right w-30"
  />
</template>

<style scoped>
.inline-suffix {
  font-size: 14px;
  line-height: 18px;
}
</style>
