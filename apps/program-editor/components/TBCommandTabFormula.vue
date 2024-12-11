<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{ command: MachineCommand }>()
</script>

<template>
  <div>
    <slot />
  </div>
</template>
