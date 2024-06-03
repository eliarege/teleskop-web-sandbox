<script setup lang="ts">
import type { TopbarMenuItem } from 'nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const tt = (key: string) => toRef(() => t(key))

const items = [
  {
    label: tt('dispensingManager._'),
    to: '/',
  },
  {
    label: tt('dispensingManager.recipeMeasurement'),
    to: '/recete-tartim',
  },
  {
    label: tt('registeredJobOrders._'),
    to: '/registered-job-orders',
  },
  {
    label: tt('settings._'),
    to: '/settings',
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
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-black text-white select-none"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink>
            <Icon
              name="IconEliar"
              size="2.5rem"
              class="p-1"
            />
          </QToolbarTitle>
          <NuxtLink
            v-for="(item, index) in items"
            :key="index"
            class="topbar-link"
            :href="item.to"
          >
            <TopbarButton
              :label="unref(item.label)"
              :disable="unref(item.disabled)"
            />
          </NuxtLink>
        </template>
        <TopbarButton
          v-else
          icon="menu"
        >
          <TopbarMenu :items="itemsMobile" />
        </TopbarButton>
        <QSpace />
        <div class="space-x-1">
          <TopbarFullscreenButton />
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
.topbar-link.router-link-active {
  background-color: gray;
}
</style>
