<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const tt = (key: string) => () => t(key)

const items = [
  {
    label: tt('menu.system'),
    subMenu: {
      items: [[
        {
          label: tt('menu.print'),
          icon: 'print',
          disabled: true,
          subMenu: {
            items: [[
              { label: tt('menu.programList') },
              { label: tt('menu.program') },
            ]],
          },
        },
        {
          label: tt('menu.exportToExcel'),
        },
      ]],
    },
  },
  {
    label: tt('menu.edit'),
    subMenu: {
      items: [[
        { label: tt('menu.cut'), icon: 'content_cut' },
        { label: tt('menu.copy'), icon: 'content_copy', disabled: true },
        { label: tt('menu.findReplace') },
      ]],
    },
  },
  { label: tt('menu.tools') },
  {
    label: tt('menu.program'),
    subMenu: {
      items: [
        [
          { label: tt('menu.newProgram'), icon: 'copyright', shortcut: 'Ctrl+N' },
          { label: tt('menu.editProgram'), icon: 'folder_copy' },
          { label: tt('menu.deleteProgram'), icon: 'difference', disabled: true, shortcut: 'Ctrl+D' },
        ],
        [
          { label: tt('menu.sendProgram') },
          { label: tt('menu.getProgram') },
          { label: tt('menu.getAllPrograms'), icon: 'scanner' },
          { label: tt('menu.sendAllPrograms'), icon: 'attribution' },
        ],
        [
          { label: tt('menu.relabel') },
        ],
      ],
    },
  },
  { label: tt('menu.settings') },
  {
    label: tt('menu.help'),
    subMenu: {
      items: [[
        { label: tt('menu.about'), icon: 'info_outline' },
      ]],
    },
  },
] as TopbarMenuItem[]

const itemsMobile = [
  [
    {
      label: tt('menu.home'),
      icon: 'home',
      to: '/',
    },
  ],
  items,
] as TopbarMenuItem[][]
</script>

<template>
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-white text-black !dark:(bg-dark text-white) select-none"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink>
            <TopbarHomeButton />
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
        <QSpace />
        <div class="space-x-1">
          <TopbarAppGrid />
          <TopbarAuthenticatedUser />
          <TopbarUnauthenticatedUser />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <slot />
    </QPageContainer>
  </QLayout>
</template>
