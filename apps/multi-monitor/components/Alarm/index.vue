<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { data: alarms } = await useFetch('/api/alarms', {
  default: () => [],
})
watch(
  () => window.location.hash,
  () => {
    scrollToHash()
  },
)
function scrollToHash() {
  const hash = window.location.hash.slice(1)
  if (hash) {
    const element = document.getElementById(hash)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
</script>

<template>
  <div class="flex-center gap-7 w-min m-auto">
    <div>
      <AlarmSidebar :machines="alarms.map((m) => ({ name: m.machineName, id: m.machineId }))" />
    </div>
    <div
      class="flex-center w-full max-h-92vh overflow-auto"
    >
      <AlarmCard :alarms />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
