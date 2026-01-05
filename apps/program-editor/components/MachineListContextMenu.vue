<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import type { MachineInfo, ProgramTableRow } from '~/shared/types'

const props = defineProps<{
  machine: MachineInfo
}>()

const $q = useQuasar()
const { t } = useI18n()
const appList = useAppList()
const { fetch } = useKeycloak()
const { $commandManager } = useNuxtApp()

const isMachineDisabled = props.machine.disabled ?? false

const machinesAppUrl = appList.find(app => app.name === 'machines')?.url

const items = computed(() => [[
  {
    label: t('machineContextMenu.sendAllPrograms'),
    icon: 'send',
    disabled: isMachineDisabled,
    onClick: () => {
      $commandManager.executeCommand('sendAllPrograms', { $q }, { id: props.machine.id, name: props.machine.name })
    },
  },
  {
    label: t('machineContextMenu.getAllPrograms'),
    icon: 'download',
    disabled: isMachineDisabled,
    onClick: () => {
      $commandManager.executeCommand('getAllPrograms', { $q }, { id: props.machine.id, name: props.machine.name })
    },
  },
  {
    label: t('machineContextMenu.copy'),
    icon: 'content_copy',
    disabled: isMachineDisabled,
    onClick: async () => {
      const programs = await fetch<ProgramTableRow[]>(`/api/machine/${props.machine.id}/program`)
      contextMenuStore.copy(props.machine.id, programs)
    },
  },
  {
    label: t('machineContextMenu.paste'),
    icon: 'content_paste',
    disabled: !contextMenuStore.isThereCopiedValue.value || isMachineDisabled,
    onClick: () => {
      $commandManager.executeCommand(
        'pasteProgram',
        { $q, fetchPrograms: () => {} },
        props.machine.id,
      )
    },
  },
  {
    label: t('machineContextMenu.goToMachineApp'),
    icon: 'open_in_new',
    disabled: !machinesAppUrl,
    onClick: () => {
      navigateTo(machinesAppUrl, { external: true, open: { target: '_blank' } })
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
