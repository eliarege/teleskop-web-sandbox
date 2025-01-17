<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import { EliarModal } from '@teleskop/ui'
import { isDef } from '@teleskop/utils'
import MachineCommandList from '~/components/MachineCommandList.vue'
import MachineList from '~/components/MachineList.vue'
import ProgramTitle from '~/components/ProgramTitle.vue'
import ContextBar from '~/components/ContextBar.vue'
import { useEditorStore } from '~/composables/editor'
import TBAllCommandsDialog from '~/components/TBAllCommandsDialog.vue'
import TopbarNotificationButton from '~/components/TopbarNotificationButton.vue'

const { $commandManager } = useNuxtApp()
const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')
const $q = useQuasar()
const route = useRoute()

const editor = useEditorStore()
const { notifyError } = useNotify()
editor.machine = editor.createMachine()

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
                disabled: true,
              },
              {
                label: tt('menu.program'),
                shortcut: 'Ctrl+P',
                onClick() {
                  $commandManager.executeCommand('printProgram', { $q })
                },
                disabled: true,
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
  { label: tt('menu.tools'), disabled: true },
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
          { label: tt('menu.getAllPrograms'), icon: 'download', disabled: true },
          { label: tt('menu.sendAllPrograms'), icon: 'upload', disabled: true },
        ],
        [
          {
            label: tt('menu.rename'),
            icon: 'edit',
            disabled: () => editor.selectedPrograms.length < 1,
            onClick() {
              $commandManager.executeCommand('changeName', { $q }, editor.machine.id, editor.selectedPrograms[0].programNo)
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
            editor.popupVersionDialog = true
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
            const stepIndex = Number(errors[errors.length - 1].split('-')[0])

            if (!hasMainStepError) {
              $commandManager.executeCommand('tempTimeGraph', { $q })
            } else {
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
            $commandManager.executeCommand('stepCommandGraph', { $q })
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
          label: tt('menu.appSettings'),
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
            <NuxtLink to="/">
              <TwIcon
                name="i-tw:eliar"
                size="2.5rem"
                class="p-1"
              />
            </NuxtLink>
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
          <TopbarAuthenticatedUser />
          <TopbarUnauthenticatedUser />
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
      <MachineList />
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
