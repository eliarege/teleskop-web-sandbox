<script setup lang="ts">
import type { ModelRef } from 'vue'

defineProps<{
  rules?: Array<any>
  outlined?: boolean
  dense?: boolean
  filled?: boolean
  label?: string
  clearable?: boolean
}>()
const model: ModelRef<number | undefined, string> = defineModel()
const id = useId()
</script>

<template>
  <q-field
    :id="id"
    v-model="model"
    :dense="dense"
    :clearable="clearable"
    :label="label"
    :for="id"
    :filled="filled"
    :outlined="outlined"
    :rules="rules"
  >
    <template #control>
      <DurationInputRaw :id="id" v-model="model" />
    </template>
  </q-field>
</template>
