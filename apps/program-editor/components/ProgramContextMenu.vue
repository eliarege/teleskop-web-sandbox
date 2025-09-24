<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'

defineProps<{
  items: TopbarMenuItem[][]
}>()
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
