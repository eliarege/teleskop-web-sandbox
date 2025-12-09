<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import { isDef } from '@teleskop/utils'
import MachineCommandList from '~/components/MachineCommandList.vue'
import MachineList from '~/components/MachineList.vue'
import ProgramTitle from '~/components/ProgramTitle.vue'
import ContextBar from '~/components/ContextBar.vue'
import { useEditorStore } from '~/composables/editor'
import TopbarNotificationButton from '~/components/TopbarNotificationButton.vue'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const { $commandManager } = useNuxtApp()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const editor = useEditorStore()
const { notifyError } = useNotify()

editor.isLoading = true
await editor.fetchTeleskopSettings()
await editor.fetchAllProcessTypes()
await editor.fetchMachineGroups()
editor.isLoading = false

const tt = (key: string) => toRef(() => t(key))

const items = [
  {
    label: tt('menu.system'),
    subMenu: {
      items: [[
        {
          label: tt('menu.print'),
          icon: 'print',
          subMenu: {
            items: [[
              {
                label: tt('menu.programList'),
                shortcut: 'Ctrl+L',
                onClick() {
                  $commandManager.executeCommand('printProgramList', { $q })
                },
              },
              {
                label: tt('menu.program'),
                shortcut: 'Ctrl+P',
                onClick() {
                  $commandManager.executeCommand('printProgram', { $q })
                },
              },
            ]],
          },
        },
        {
          label: tt('menu.exportToExcel'),
          onClick() {
            $commandManager.executeCommand('exportToExcel', { $q })
          },
        },
      ]],
    },
  },
  {
    label: tt('menu.tools'),
    disabled: false,
    subMenu: {
      items: [[
        {
          label: tt('menu.findAndReplace'),
          icon: 'search',
          shortcut: 'Ctrl+F',
          onClick() {
            $commandManager.executeCommand('findAndReplace', { $q }, editor.machine.id, editor.machine.name)
          },
        },
        {
          label: tt('menu.checkProgram'),
          icon: 'check_circle',
          shortcut: 'F6',
          disabled: () => !editor.selectedPrograms.length,
          onClick() {
            $commandManager.executeCommand('checkErrors', { $q }, editor.machine.id, editor.selectedPrograms)
          },
        },
      ]],
    },
  },
  {
    label: tt('menu.program'),
    disabled: computed(() => !isDef(route.params.machine_id)),
    subMenu: {
      items: [
        [
          {
            label: tt('menu.newProgram'),
            icon: 'add_circle_outline',
            shortcut: 'F2',
            onClick() {
              $commandManager.executeCommand('newProgram', { $q })
            },
          },
          {
            label: tt('menu.editProgram'),
            icon: 'edit',
            shortcut: 'F3',
            disabled: () => editor.selectedPrograms.length < 1,
            onClick() {
              navigateTo(`/machine/${editor.machine.id}/program/${Math.min(...editor.selectedPrograms.map(p => p.programNo))}`)
            },
          },
          {
            label: tt('menu.deleteProgram'),
            icon: 'delete',
            shortcut: 'Ctrl+Del',
            disabled: () => editor.selectedPrograms.length < 1,
            onClick() {
              $commandManager.executeCommand('deleteProgram', { $q }, editor.selectedPrograms, editor.machine.id)
            },
          },
        ],
        [
          { label: tt('menu.sendAllPrograms'), icon: 'send', onClick() {
            const { id, name } = editor.machine
            $commandManager.executeCommand('sendAllPrograms', { $q }, { id, name })
          } },
          { label: tt('menu.getAllPrograms'), icon: 'download', onClick() {
            const { id, name } = editor.machine
            $commandManager.executeCommand('getAllPrograms', { $q }, { id, name })
          } },
        ],
        [
          {
            label: tt('menu.rename'),
            icon: 'edit',
            disabled: () => editor.selectedPrograms.length < 1,
            onClick() {
              $commandManager.executeCommand('renameProgram', { $q }, editor.machine.id, editor.selectedPrograms[0].programNo)
            },
          },
        ],
      ],
    },
  },
  {
    label: tt('menu.appearance'),
    disabled: computed(() => !isDef(route.params.program_no)),
    subMenu: {
      items: [[
        {
          label: tt('menu.versionInfo'),
          icon: 'info',
          onClick: () => {
            const { programNo, name } = editor.program
            $commandManager.executeCommand('programVersionInfo', { $q }, {
              programNo,
              name,
            })
          },
        },
        {
          label: tt('menu.commandInfo'),
          icon: 'info',
          onClick: () => {
            $commandManager.executeCommand('allCommandsList', { $q })
          },
        },
      ], [
        {
          label: tt('menu.tempTimeGraph'),
          icon: 'timeline',
          shortcut: 'F8',
          onClick: () => {
            const editor = useEditorStore()
            const errors = Array.from(editor.errorIds.values())
            const hasMainStepError = checkMainStepForErrors(errors)

            if (!hasMainStepError) {
              const { machine, program, teleskopSettings } = editor
              const initialTemperature = teleskopSettings.initialTemperature
              $commandManager.executeCommand('tempTimeGraph', { $q }, machine, program, initialTemperature)
            } else {
              const stepIndex = Number(errors[errors.length - 1].split('-')[0])
              notifyError(t('invalidCommand'))
              editor.scrollPage(stepIndex, true)
            }
          },
        },
        {
          label: tt('menu.stepCommandGraph'),
          icon: 'timeline',
          shortcut: 'F7',
          onClick: () => {
            const editor = useEditorStore()
            const errors = Array.from(editor.errorIds.values())
            const hasMainStepError = checkMainStepForErrors(errors)

            if (!hasMainStepError) {
              $commandManager.executeCommand('stepCommandGraph', { $q }, editor.machine, editor.program)
            } else {
              const stepIndex = Number(errors[errors.length - 1].split('-')[0])
              notifyError(t('invalidCommand'))
              editor.scrollPage(stepIndex, true)
            }
          },
        },
      ]],
    },
  },
  {
    label: tt('menu.settings'),
    subMenu: {
      items: [[
        {
          label: tt('menu.programTypes'),
          onClick() {
            $commandManager.executeCommand('editProgramTypes', { $q })
          },
        },
        {
          label: tt('menu.commandIconSettings'),
          onClick() {
            $commandManager.executeCommand('editProgramIcons', { $q })
          },
        },
        {
          label: tt('menu.writeProgramSettings'),
          onClick() {
            $commandManager.executeCommand('writeProgramSettings', { $q })
          },
        },
      ],
      ],
    },
  },
  {
    label: tt('menu.projectInfo'),
    disabled: computed(() => !editor.machine.commands.size),
    subMenu: {
      items: [[
        {
          label: tt('menu.allCommandList'),
          disable: isDef(route.params.program_no),
          onClick() {
            $commandManager.executeCommand('allCommandsList', { $q })
          },
        },
        {
          label: tt('menu.machineConstants'),
          onClick() {
            $commandManager.executeCommand('machineConstants', { $q }, editor.machine.id)
          },
        },
      ]],
    },
  },
] as TopbarMenuItem[]

const itemsMobile = [
  [
    {
      label: tt('base.home'),
      icon: 'home',
      to: '/',
    },
  ],
  items,
] as TopbarMenuItem[][]

const goRoot = computed(() => {
  return route.path === '/' || /^\/machine\/(\d+)$/.test(route.path)
})
</script>

<template>
  <QLayout view="hHh LpR fFf" class="bg-gray-1 dark:bg-dark-4">
    <QHeader
      borderless
      class="bg-gray-1 text-black !dark:(bg-dark-1 text-gray-1) select-none"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink>
            <TopbarHomeButton :go-root="goRoot" />
          </QToolbarTitle>
          <TopbarButton
            v-for="(item, index) in items"
            :key="index"
            :label="toValue(item.label)"
            :disable="toValue(item.disabled)"
          >
            <TopbarMenu
              v-if="item.subMenu"
              v-bind="item.subMenu"
            />
          </TopbarButton>
        </template>
        <TopbarButton
          v-else
          icon="menu"
        >
          <TopbarMenu :items="itemsMobile" />
        </TopbarButton>
        <div
          class="flex-grow-2 text-center text-bold"
        >
          <ProgramTitle />
        </div>
        <QSpace />
        <div class="space-x-1">
          <TopbarNotificationButton />
          <TopbarFullscreenButton />
          <TopbarAppGrid />
          <TopbarUser>
            <TopbarPtCommonSettings />
          </TopbarUser>
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QDrawer
      v-model="editor.leftDrawerOpen"
      side="left"
      borderless
      class="bg-light-7 dark:bg-dark-3"
    >
      <MachineList :machine-groups="editor.machineGroups" />
    </QDrawer>

    <QPageContainer>
      <QPage>
        <div
          class="flex sticky top-10 z-10 bg-light-7  dark:bg-dark-3"
        >
          <ContextBar />
        </div>
        <div>
          <NuxtPage />
        </div>
      </QPage>
    </QPageContainer>

    <QDrawer
      v-model="editor.rightDrawerOpen"
      side="right"
      borderless
      class="bg-light-7 dark:bg-dark-3"
    >
      <MachineCommandList />
    </QDrawer>
  </QLayout>
</template>

<style lang="postcss" scoped>
::deep(.q-drawer) {
  z-index: 10 !important;
}
</style>
