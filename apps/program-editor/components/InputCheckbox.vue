<script setup lang="ts">
const props = defineProps<{
  label?: string
}>()
const model = defineModel<number>()
</script>

<template>
  <QField
    :model-value="model"
    dense
    outlined
    class="input-checkbox"
  >
    <QCheckbox
      v-model="model"
      :true-value="1"
      :false-value="0"
      class="text-black text-3"
      dense
    >
      {{ props.label }}
    </QCheckbox>
  </QField>
</template>

<style scoped>
.input-checkbox {
  white-space: nowrap;
}
.input-checkbox .q-field__control {
  padding-left: 0;
}
.input-checkbox :deep(.q-checkbox__inner) {
  font-size: 36px;
}
</style>
