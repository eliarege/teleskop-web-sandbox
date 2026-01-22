<script setup lang="ts">
import type { TopbarMenuItem } from '../../types'
import { useTopbarSettingItems } from '../../composables/useTopbarSettingItems'

const props = defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()

const { items } = useTopbarSettingItems({
  disableTheme: props.disableTheme,
  extraItems: props.extraItems,
})
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
