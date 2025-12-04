<script setup lang="ts">
const props = defineProps<{
  text: string
  maxLength?: number
}>()

const maxLength = computed(() => props.maxLength ?? 15)
const truncated = computed(() => {
  if (!props.text)
    return ''

  return props.text.length > maxLength.value
    ? `${props.text.slice(0, maxLength.value)}…`
    : props.text
})
</script>

<template>
  <span>
    <template v-if="truncated !== props.text">
      {{ truncated }}
      <QTooltip>{{ props.text }}</QTooltip>
    </template>
    <template v-else>
      {{ truncated }}
    </template>
  </span>
</template>
