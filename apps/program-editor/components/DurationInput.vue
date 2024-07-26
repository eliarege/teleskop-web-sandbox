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
    :id
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
      <DurationInputRaw :id="id" v-model="model" />
    </template>
  </q-field>
</template>
