<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import type { ProgramTableRow } from '~/shared/types'

const props = defineProps<{
  machineId: number
  machineName: string
}>()

const $q = useQuasar()
const { t } = useI18n()
const { fetch } = useKeycloak()
const { $commandManager } = useNuxtApp()

const items = computed(() => [[
  {
    label: t('machineContextMenu.sendAllPrograms'),
    icon: 'send',
    disabled: false,
    onClick: () => {
      $commandManager.executeCommand('sendAllPrograms', { $q }, { id: props.machineId, name: props.machineName })
    },
  },
  {
    label: t('machineContextMenu.getAllPrograms'),
    icon: 'download',
    disabled: false,
    onClick: () => {
      $commandManager.executeCommand('getAllPrograms', { $q }, { id: props.machineId, name: props.machineName })
    },
  },
  {
    label: t('machineContextMenu.copy'),
    icon: 'content_copy',
    disabled: false,
    onClick: async () => {
      const programs = await fetch<ProgramTableRow[]>(`/api/machine/${props.machineId}/program`)
      contextMenuStore.copy(props.machineId, programs)
    },
  },
  {
    label: t('machineContextMenu.paste'),
    icon: 'content_paste',
    disabled: !contextMenuStore.isThereCopiedValue.value,
    onClick: () => {
      $commandManager.executeCommand(
        'pasteProgram',
        { $q, fetchPrograms: () => {} },
        props.machineId,
      )
    },
  },
  // {
  //   label: t('machineContextMenu.findChange'),
  //   disabled: true,
  // },
  // {
  //   label: t('machineContextMenu.compareAllPrograms'),
  //   disabled: true,
  // },
]] as TopbarMenuItem[][])
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
