<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import type { TopbarMenuItem } from 'nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import MachineCommandList from '~/components/MachineCommandList.vue'
import MachineList from '~/components/MachineList.vue'
import MenuProgram from '~/components/MenuProgram.vue'
import { commandManager, contextMenuStore } from '~/shared/utils'
import ProgramTitle from '~/components/ProgramTitle.vue'

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')
const $q = useQuasar()
const route = useRoute()
const machineId = computed(() => Number(route.params.machine_id))

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
                onClick() {
                  commandManager.executeCommand(printProgramListCommand, { $q })
                },
              },
              {
                label: tt('menu.program'),
                onClick() {
                  commandManager.executeCommand(printProgramCommand, { $q })
                },
              },
            ]],
          },
        },
        {
          label: tt('menu.exportToExcel'),
        },
      ]],
    },
  },
  { label: tt('menu.tools'), disabled: true },
  {
    label: tt('menu.program'),
    disabled: computed(() => !machineId.value),
    subMenu: {
      items: [
        [
          {
            label: tt('menu.newProgram'),
            icon: 'copyright',
            shortcut: 'Ctrl+N',
            onClick() {
              navigateTo(`/machine/${machineId.value}/program/new`)
            },
          },
        ],
        [
          { label: tt('menu.getAllPrograms'), icon: 'download' },
          { label: tt('menu.sendAllPrograms'), icon: 'upload' },
        ],
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
            commandManager.executeCommand(editProgramTypesCommand, { $q })
          },
        },
      ],
      ],
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

const { dark } = useQuasar()
const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<template>
  <QLayout view="hHh LpR fFf">
    <QHeader
      bordered
      class="bg-white text-black !dark:(bg-dark text-white) select-none"
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
          <TopbarAppGrid />
          <TopbarAuthenticatedUser />
          <TopbarUnauthenticatedUser />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QDrawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
    >
      <MachineList />
    </QDrawer>

    <QPageContainer>
      <div :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'" class="flex sticky top-10.2 z-10">
        <QBtn
          dense
          flat
          icon="menu"
          @click="toggleLeftDrawer"
        />
        <MenuProgram :vis="true" :path="route.path" />

        <QBtn
          dense
          flat
          icon="menu"
          @click="toggleRightDrawer"
        />
      </div>

      <div :class="dark.isActive ? 'bg-dark-8' : 'bg-white'">
        <NuxtPage />
      </div>
    </QPageContainer>

    <QDrawer
      v-model="rightDrawerOpen"
      show-if-above
      side="right"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
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
