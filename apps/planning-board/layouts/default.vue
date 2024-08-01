<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const tt = (key: string) => () => t(key)

const items = [] as TopbarMenuItem[]

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
      class="text-white bryntum-tbar-bg select-none border-b-3"
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
        <QSpace />
        <div class="space-x-1">
          <TopbarAppGrid />
          <TopbarAuthenticatedUser disable-theme />
          <TopbarUnauthenticatedUser disable-theme />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <slot />
    </QPageContainer>
  </QLayout>
</template>

<style>
.bryntum-tbar-bg {
  background-color: #686872;
}
</style>
