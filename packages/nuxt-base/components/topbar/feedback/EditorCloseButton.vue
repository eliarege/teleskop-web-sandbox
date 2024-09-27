<script setup lang="ts">
defineProps<{ color: string, textColor: string, dense: boolean }>()
defineEmits(['close'])
</script>

<template>
  <div>
    <q-btn
      icon="close"
      :dense
      rounded
      :text-color
      :color
      size="sm"
      @click="$emit('close')"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
