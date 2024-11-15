<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

definePageMeta({
  layout: 'alarm',
})

const store = useDataStore()
</script>

<template>
  <Alarm />
</template>

<style scoped lang="postcss">
</style>
