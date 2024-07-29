<script setup lang="ts">
import { QForm } from 'quasar'
import ProgramEditor from '~/components/ProgramEditor.vue'
import { useEditorStore } from '~/composables/editor'
import { useContextBar } from '~/composables/useContextBar'

const editor = useEditorStore()
const form = ref<QForm>()
const { t, locale } = useI18n()
const route = useRoute()
const $q = useQuasar()
const { $commandManager } = useNuxtApp()

const buttons = computed(() => [
  // {
  //   label: t('menu.print'),
  //   originalLabel: t('menu.print'),
  //   tooltip: t('menu.print'),
  //   shortcut: 'Ctrl+P',
  //   icon: 'print',
  //   disable: editor.isLoading,
  //   onClick() {
  //     $commandManager.executeCommand('printProgram', { $q })
  //   },
  // },
  {
    label: t('menu.save'),
    originalLabel: t('menu.save'),
    tooltip: t('menu.save'),
    shortcut: 'Ctrl+S',
    icon: 'save',
    disable: editor.isLoading,
    onClick() {
      editor.onSubmit()
    },
  },
  {
    label: t('menu.saveAs'),
    originalLabel: t('menu.saveAs'),
    tooltip: t('menu.saveAs'),
    shortcut: 'Ctrl+A',
    icon: 'save_as',
    disable: editor.isLoading,
    onClick() {
      editor.popupNewProgramVisible = true
    },
  },
  {
    label: t('menu.reset'),
    originalLabel: t('menu.reset'),
    tooltip: t('menu.reset'),
    shortcut: 'Ctrl+R',
    icon: 'refresh',
    disable: editor.isLoading,
    onClick() {
      editor.onReset()
    },
  },
  {
    label: t('menu.newStep'),
    originalLabel: t('menu.newStep'),
    tooltip: t('menu.newStep'),
    shortcut: 'F2',
    icon: 'add_circle_outline',
    disable: editor.isLoading,
    onClick() {
      editor.newStep()
    },
  },
  {
    label: t('menu.newParallelStep'),
    originalLabel: t('menu.newParallelStep'),
    tooltip: t('menu.newParallelStep'),
    shortcut: 'F3',
    icon: 'add_circle_outline',
    disable: editor.isLoading || editor.selectedStep === -1,
    onClick() {
      editor.newParallelStep()
    },
  },
  {
    label: t('menu.deleteStep'),
    originalLabel: t('menu.deleteStep'),
    tooltip: t('menu.deleteStep'),
    shortcut: 'Del',
    icon: 'delete',
    disable: (editor.isLoading || editor.selectedStep === -1),
    onClick() {
      editor.deleteStep()
    },
  },
  {
    label: t('menu.deleteParallelStep'),
    originalLabel: t('menu.deleteParallelStep'),
    tooltip: t('menu.deleteParallelStep'),
    shortcut: 'Ctrl+Del',
    icon: 'delete',
    disable: (editor.isLoading || editor.selectedStep === -1 || editor.selectedParallelStep === -1),
    onClick() {
      editor.deleteParallelStep()
    },
  },
])
useContextBar(buttons)

const machineId = Number(route.params.machine_id)
const programNo = Number(route.params.program_no)

watch(locale, () => {
  form.value?.validate()
})

editor.isLoading = true
await editor.fetchMachineCommands(machineId)
await editor.fetchProgram(machineId, programNo).then(() => {
  editor.isLoading = false
})
</script>

<template>
  <div>
    <QForm ref="form">
      <ProgramEditor />
    </QForm>
  </div>
</template>
