<script setup lang="ts">
withDefaults(defineProps<{ label?: string, icon: string, size?: string, color?: string, description?: string }>(), {
  color: 'white',
})
</script>

<template>
  <QBtn>
    <QTooltip v-if="description">
      {{ description }}
    </QTooltip>
    <TeleskopIcon :name="icon" :size="size" />
    {{ label }}
  </QBtn>
</template>

<style scoped lang="postcss">
</style>
