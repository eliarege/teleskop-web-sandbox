<script setup lang="ts">
import type { TopbarMenuItem } from 'nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import { useRouter } from 'vue-router'
import EliarModal from 'ui/components/EliarModal.vue'
import MachineCommandList from '~/components/MachineCommandList.vue'
import MachineList from '~/components/MachineList.vue'
import ProgramTitle from '~/components/ProgramTitle.vue'
import ContextBar from '~/components/ContextBar.vue'
import { useEditorStore } from '~/composables/editor'
import TBAllCommandsDialog from '~/components/TBAllCommandsDialog.vue'

const { $commandManager } = useNuxtApp()

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { dark } = useQuasar()

const editor = useEditorStore()
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
    disabled: computed(() => !editor.machine.id),
    subMenu: {
      items: [
        [
          {
            label: tt('menu.newProgram'),
            icon: 'add_circle_outline',
            shortcut: 'F2',
            onClick() {
              editor.popupNewProgramVisible = true
            },
          },
          // {
          //   label: tt('menu.editProgram'),
          //   icon: 'edit',
          //   shortcut: 'F3',
          //   onClick() {
          //     if (editor.selectedPrograms.length > 0) {
          //       router.push(`/machine/${editor.machine.id}/program/${editor.selectedPrograms[0].programNo}`)
          //     } else {
          //       router.push(`/machine/${editor.machine.id}/program/${editor.allPrograms[0].programNo}`)
          //     }
          //   },
          // },
          // {
          //   label: tt('menu.deleteProgram'),
          //   icon: 'delete',
          //   shortcut: 'Ctrl+Del',
          //   onClick() {
          //     if (editor.selectedPrograms.length > 0) {
          //       $commandManager.executeCommand('deleteProgram', { $q }, editor.selectedPrograms, editor.machine.id)
          //     }
          //   },
          // },
        ],
        [
          { label: tt('menu.getAllPrograms'), icon: 'download', disabled: true },
          { label: tt('menu.sendAllPrograms'), icon: 'upload', disabled: true },
        ],
        // [
        //   {
        //     label: tt('menu.rename'),
        //     icon: 'edit',
        //     onClick() {
        //       if (editor.selectedPrograms.length > 0) {
        //         $commandManager.executeCommand('changeName', { $q }, editor.selectedPrograms, editor.machine.id)
        //       }
        //     },
        //   },
        // ],
      ],
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
          disable: route.params.program_no === undefined,
          onClick() {
            editor.popupCommandListVisible = true
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
  <QLayout view="hHh LpR fFf" :class="dark.isActive ? 'bg-dark' : 'bg-white'">
    <QHeader
      borderless
      class="bg-gray-2 text-black !dark:(bg-dark-1 text-gray-1) select-none"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink>
            <NuxtLink to="/">
              <Icon
                name="IconEliar"
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
      show-if-above
      side="left"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
    >
      <MachineList />
    </QDrawer>

    <QPageContainer>
      <QPage>
        <div
          :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
          class="flex sticky top-10 z-10"
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
      show-if-above
      side="right"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
    >
      <MachineCommandList />
    </QDrawer>
  </QLayout>

  <EliarModal v-if="editor.popupCommandListVisible">
    <TBAllCommandsDialog />
  </EliarModal>

  <EliarModal v-if="editor.popupCommandDetailVisible">
    <TBCommandDetailDialog />
  </EliarModal>
</template>

<style lang="postcss" scoped>
::deep(.q-drawer) {
  z-index: 10 !important;
}
</style>
