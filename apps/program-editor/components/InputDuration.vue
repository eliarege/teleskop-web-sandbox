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

const minutes = computed({
  get() {
    return model.value ? (model.value / 60).toString() : ''
  },
  set(value) {
    model.value = Number.parseFloat(value) * 60
  },
})

function updateModel() {
  emit('update:modelValue', model.value)
}
</script>

<template>
  <QInput
    ref="input"
    v-model="minutes"
    :for="id"
    :label="props.label"
    :rules="rules"
    hide-bottom-space
    autocomplete="off"
    outlined
    dense
    suffix="min"
    input-class="text-right w-30"
    @blur="updateModel"
  />
</template>

<style scoped>
.inline-suffix {
  font-size: 14px;
  line-height: 18px;
}
</style>
