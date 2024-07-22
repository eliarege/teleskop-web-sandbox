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

const rules = [
  (value: string) => {
    if (
      !Number.isNaN(value) && between(
        parseDuration(value),
        props.minValue,
        props.maxValue,
      )
    ) {
      return true
    } else {
      return t('valueOutOfRange', {
        minValue: formatDuration(props.minValue),
        maxValue: formatDuration(props.maxValue),
      })
    }
  },
]

const time = computed({
  get() {
    if (!model.value) {
      return '00:00:00'
    }
    return formatDuration(model.value)
  },
  set(value) {
    model.value = parseDuration(value)
  },
})
</script>

<template>
  <QInput
    ref="input"
    v-model="time"
    :for="id"
    :label="label"
    :rules="rules"
    mask="fulltime"
    input-class="text-right"
    hide-bottom-space
    no-error-icon
    outlined
    dense
  />
</template>
