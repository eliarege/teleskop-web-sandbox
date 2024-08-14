<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  commandIndex: number
  label: string
}>()

const emit = defineEmits(['update:modelValue'])

function toggle() {
  emit('update:modelValue', props.modelValue ^ (1 << props.commandIndex))
}

const isChecked = computed(() => {
  return (props.modelValue & (1 << props.commandIndex)) > 0
})
</script>

<template>
  <div>
    <q-checkbox
      v-model="isChecked"
      :label="props.label"
      @update:model-value="toggle"
    />
  </div>
</template>
