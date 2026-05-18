<script lang ="ts" setup>
import { useStateStore } from '~/store/State'

const state = useStateStore()

try {
  const info = await $fetch<{
    name: string
    logoPath: string | null
    partCountActive: boolean
    defaultUnitTypeDye: number
    defaultUnitTypeChem: number
    partCountColumn: string | null
  }>('/api/company/info')
  if (info) {
    state.partCountActive = info.partCountActive ?? false
    state.defaultUnitTypeDye = info.defaultUnitTypeDye
    state.defaultUnitTypeChem = info.defaultUnitTypeChem
    state.partCountColumn = info.partCountColumn ?? null
  }
}
catch (error) {
  console.warn('[recipe-config] Failed to load config from server, using cached value', error)
}
</script>

<template>
  <NuxtLayout class="recipes">
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="postcss">
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

::-webkit-scrollbar {
  width: 0.55rem;
  height: 0.55rem;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #000000;
}

.body--dark .recipes .virtual-scroll .q-table__top,
.body--dark .recipes .virtual-scroll .q-table__bottom,
.body--dark .recipes .virtual-scroll thead tr:first-child th {
  @apply !bg-truegray-900;
}
</style>
