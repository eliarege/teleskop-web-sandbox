<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

definePageMeta({
  layout: 'empty',
  middleware: ['auth'],
  roles: ['access-vnc'],
})
const store = useDataStore()
const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const currentMachine = computed(() => {
  return store.machines.find(machine => machine.id === Number.parseInt(route.params.id as string))
})

useHead({
  title: () => currentMachine.value?.name || `${t('loading')}...`,
})
</script>

<template>
  <div v-if="currentMachine" class="text-center pt-4">
    <MachineVnc
      class="inline"
      :machine-id="currentMachine.id"
      :machine-name="currentMachine.name"
      :websockify-url="config.public.websockifyUrl"
    />
  </div>
</template>
