<script setup lang="ts">
// To be implemented later ..
const emit = defineEmits(['update:comparison'])
const comparison = ref(false)
</script>

<template>
  <div class="flex pos-right-2xl fixed ">
    <div class="text-right" />
    <q-checkbox
      v-model="comparison"
      label="Karşılaştırma"
      @update:model-value="val => emit('update:comparison', val)"
    />
  </div>
</template>
