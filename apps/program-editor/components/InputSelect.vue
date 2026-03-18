<script setup lang="ts">
import type { QSelect } from 'quasar'

defineProps<{
  label?: string
  options?: any[]
  optionLabel?: string | ((opt: any) => string)
  rules?: Array<any>
  outlined?: boolean
  dense?: boolean
  hideBottomSpace?: boolean
  optionsDense?: boolean
}>()

const emit = defineEmits<{
  focus: []
}>()

const model = defineModel<number | string>()
const id = useId()
const editor = useEditorStore()
const input = ref<QSelect>()

watch(() => input.value?.hasError, (value) => {
  if (value) {
    editor.errorIds.add(id)
  } else {
    editor.errorIds.delete(id)
  }
})

onMounted(() => {
  if (input.value)
    input.value.focus()
})

onUnmounted(() => {
  editor.errorIds.delete(id)
})

function handleUpdate() {
  nextTick(() => input.value?.validate())
}
</script>

<template>
  <QSelect
    ref="input"
    v-model="model"
    :label="label"
    :options="options"
    :option-label="optionLabel"
    :rules="rules"
    option-value="value"
    :options-dense="optionsDense"
    map-options
    emit-value
    :outlined="outlined"
    :dense="dense"
    :hide-bottom-space="hideBottomSpace"
    @focus="emit('focus')"
    @update:model-value="handleUpdate"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </QSelect>
</template>
