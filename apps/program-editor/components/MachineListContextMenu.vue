<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import TBFindAndReplaceDialog from './TBFindAndReplaceDialog.vue'
import type { Machine, MachineGroup, MachineInfo, ProcessType, ProgramTableRow } from '~/shared/types'
import { useMachineStatusStore } from '~/composables/machine'

type GroupContext = { type: 'group', group: MachineGroup, machine?: never, processType?: never }
type MachineContext = { type: 'machine', machine: MachineInfo, group?: never, processType?: never }
type ProcessTypeContext = { type: 'processType', machine: MachineInfo, processType: ProcessType, group?: never }

type ContextMenuProps = GroupContext | MachineContext | ProcessTypeContext

const props = defineProps<ContextMenuProps>()

const $q = useQuasar()
const { t } = useI18n()
const appList = useAppList()
const editor = useEditorStore()
const { fetch } = useKeycloak()
const { notifySuccess, notifyError } = useNotify()
const machineStatusStore = useMachineStatusStore()

const machinesAppUrl = appList.find(app => app.name === 'machines')?.url

// Gruptaki tüm makinelere programları gönder
async function sendAllProgramsToGroup(group: MachineGroup) {
  const enabledMachines = group.machines.filter(m => !m.disabled)
  if (!enabledMachines.length)
    return

  editor.isLoading = true
  try {
    for (const machine of enabledMachines) {
      const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
      if (status) {
        await contextMenuStore.sendAllPrograms(machine)
      }
    }
    notifySuccess(t('machineContextMenu.group.sendSuccess', { name: group.name }))
  } catch (error: any) {
    notifyError(t('machineContextMenu.group.sendFailed', { name: group.name }))
  } finally {
    editor.isLoading = false
    await editor.refreshAllPrograms()
  }
}

// Gruptaki tüm makinelerden programları al
async function getAllProgramsFromGroup(group: MachineGroup) {
  const enabledMachines = group.machines.filter(m => !m.disabled)
  if (!enabledMachines.length)
    return

  editor.isLoading = true
  try {
    for (const machine of enabledMachines) {
      const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
      if (status) {
        await contextMenuStore.getAllPrograms(machine)
      }
    }
    notifySuccess(t('machineContextMenu.group.getSuccess', { name: group.name }))
  } catch (error: any) {
    notifyError(t('machineContextMenu.group.getFailed', { name: group.name }))
  } finally {
    editor.isLoading = false
    await editor.refreshAllPrograms()
  }
}

// Makine grubu için menü öğeleri
const groupItems = computed(() => {
  if (props.type !== 'group')
    return []

  const { group } = props
  const allDisabled = group.machines.every(m => m.disabled)

  return [[
    {
      label: t('machineContextMenu.group.sendAllPrograms', { name: group.name }),
      icon: 'send',
      disabled: allDisabled,
      onClick: () => sendAllProgramsToGroup(group),
    },
    {
      label: t('machineContextMenu.group.getAllPrograms', { name: group.name }),
      icon: 'download',
      disabled: allDisabled,
      onClick: () => getAllProgramsFromGroup(group),
    },
  ]] as TopbarMenuItem[][]
})

// Makine için menü öğeleri
const machineItems = computed(() => {
  if (props.type !== 'machine')
    return []

  const { machine } = props
  const isMachineDisabled = machine.disabled ?? false

  return [[
    {
      label: t('machineContextMenu.machine.sendAllPrograms', { name: machine.name }),
      icon: 'send',
      disabled: isMachineDisabled,
      onClick: async () => {
        const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
        if (!status)
          return

        const programs = await fetch<ProgramTableRow[]>(`/api/machine/${machine.id}/program`)
        if (!programs.length) {
          notifyError(t('machineContextMenu.machine.noPrograms', { name: machine.name }))
          return
        }

        await contextMenuStore.sendAllPrograms({ id: machine.id, name: machine.name })
        await editor.refreshAllPrograms()
      },
    },
    {
      label: t('machineContextMenu.machine.getAllPrograms', { name: machine.name }),
      icon: 'download',
      disabled: isMachineDisabled,
      onClick: async () => {
        const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
        if (status) {
          await contextMenuStore.getAllPrograms({ id: machine.id, name: machine.name })
          await editor.refreshAllPrograms()
        }
      },
    },
    {
      label: t('machineContextMenu.machine.findAndReplace', { name: machine.name }),
      icon: 'find_replace',
      disabled: isMachineDisabled,
      onClick: async () => {
        const machineStore = useMachineStore()
        let targetMachine: Machine

        if (machine.id !== machineStore.currentMachine.id) {
          targetMachine = await machineStore.fetchMachine(props.machine.id)
        } else {
          targetMachine = machineStore.currentMachine
        }

        $q.dialog({
          component: TBFindAndReplaceDialog,
          componentProps: {
            machineId: targetMachine.id,
            machineName: targetMachine.name,
            machineCommands: targetMachine.commands,
          },
        }).onOk(async () => {
          await editor.refreshAllPrograms()
        })
      },
    },
    {
      label: t('machineContextMenu.machine.copy'),
      icon: 'content_copy',
      disabled: isMachineDisabled,
      onClick: async () => {
        const programs = await fetch<ProgramTableRow[]>(`/api/machine/${machine.id}/program`)
        contextMenuStore.copy(machine.id, programs)
      },
    },
    {
      label: t('machineContextMenu.machine.paste'),
      icon: 'content_paste',
      disabled: !contextMenuStore.isThereCopiedValue.value || isMachineDisabled,
      onClick: async () => {
        await contextMenuStore.paste(machine.id)
        await editor.refreshAllPrograms()
      },
    },
    {
      label: t('machineContextMenu.machine.goToMachineApp'),
      icon: 'open_in_new',
      disabled: !machinesAppUrl,
      onClick: () => {
        navigateTo(machinesAppUrl, { external: true, open: { target: '_blank' } })
      },
    },
  ]] as TopbarMenuItem[][]
})

// Program tipi için menü öğeleri
const processTypeItems = computed(() => {
  if (props.type !== 'processType')
    return []

  const { machine, processType } = props
  const isMachineDisabled = machine.disabled ?? false

  return [[
    {
      label: t('machineContextMenu.processType.sendPrograms', { name: processType.label }),
      icon: 'send',
      disabled: isMachineDisabled,
      onClick: async () => {
        const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
        if (!status)
          return

        const programs = await fetch<ProgramTableRow[]>(`/api/machine/${machine.id}/program`, {
          query: { processType: processType.value },
        })

        if (!programs.length) {
          notifyError(t('machineContextMenu.processType.noPrograms', { name: processType.label }))
          return
        }

        await contextMenuStore.sendProgram(programs, machine.id)
        await editor.refreshAllPrograms()
      },
    },
    {
      label: t('machineContextMenu.processType.getPrograms', { name: processType.label }),
      icon: 'download',
      disabled: isMachineDisabled,
      onClick: async () => {
        const status = await machineStatusStore.checkMachineStatus(machine.id, machine.name)
        if (!status)
          return

        const programs = await fetch<ProgramTableRow[]>(`/api/machine/${machine.id}/program`, {
          query: { processType: processType.value },
        })
        await contextMenuStore.getRemoteProgram(programs, machine.id)
        await editor.refreshAllPrograms()
      },
    },
    {
      label: t('machineContextMenu.processType.copy', { name: processType.label }),
      icon: 'content_copy',
      disabled: isMachineDisabled,
      onClick: async () => {
        const programs = await fetch<ProgramTableRow[]>(`/api/machine/${machine.id}/program`, {
          query: { processType: processType.value },
        })
        contextMenuStore.copy(machine.id, programs)
      },
    },
    {
      label: t('machineContextMenu.processType.paste', { name: processType.label }),
      icon: 'content_paste',
      disabled: !contextMenuStore.isThereCopiedValue.value || isMachineDisabled,
      onClick: async () => {
        await contextMenuStore.paste(machine.id)
        await editor.refreshAllPrograms()
      },
    },
  ]] as TopbarMenuItem[][]
})

const items = computed(() => {
  switch (props.type) {
    case 'group':
      return groupItems.value
    case 'machine':
      return machineItems.value
    case 'processType':
      return processTypeItems.value
    default:
      return []
  }
})
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
