<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'

const props = defineProps<{
  machineId: number
}>()

const { $commandManager } = useNuxtApp()
const { fetch } = useNuxtApp().$keycloak
const $q = useQuasar()
const { t } = useI18n()

const items = computed(() => [[
  {
    label: t('machineContextMenu.uploadAllPrograms'),
    disabled: false,
    onClick: async () => {
      const programs = await fetch(`/api/machine/${props.machineId}/program`)
      $commandManager.executeCommand(
        'sendProgram',
        { $q, fetchPrograms: navigateTo(`/machine/${props.machineId}`) },
        programs,
        props.machineId!,
      )
    },
  },
  {
    label: t('machineContextMenu.downloadAllPrograms'),
    disabled: false,
    onClick: async () => {
      const programs = await fetch(`/api/machine/${props.machineId}/program`)
      $commandManager.executeCommand(
        'sendProgram',
        { $q, fetchPrograms: navigateTo(`/machine/${props.machineId}`) },
        programs,
        props.machineId!,
      )
    },
  },
  {
    label: t('machineContextMenu.copy'),
    disabled: false,
    onClick: async () => {
      const programs = await fetch(`/api/machine/${props.machineId}/program`)
      contextMenuStore.copy(programs, props.machineId)
    },
  },
  {
    label: t('machineContextMenu.paste'),
    disabled: !contextMenuStore.isThereCopiedValue.value,
    onClick: () => {
      $commandManager.executeCommand(
        'pasteProgram',
        { $q, fetchPrograms: () => {} },
        props.machineId,
      )
    },
  },
  {
    label: t('machineContextMenu.findChange'),
    disabled: true,
  },
  {
    label: t('machineContextMenu.compareAllPrograms'),
    disabled: true,
  },
]] as TopbarMenuItem[][])
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
