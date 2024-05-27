<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const { t } = useI18n()
const route = useRoute()
const currentMachine = computed(() => {
  return store.machines.find(machine => machine.id === Number.parseInt(route.params.id as string))
})

useHead({
  title: () => currentMachine.value?.name || `${t('loading')}...`,
})
</script>

<template>
  <div v-if="currentMachine" class="text-center pt-4">
    <MachineVnc class="inline" :machine="currentMachine" />
  </div>
</template>
