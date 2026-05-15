<script lang="ts" setup>
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { useDataStore } from '~/store/DataStore'
import { breakpointsTailwind } from '@vueuse/core'

const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const dataStore = useDataStore()
function goToHomepage() {
  dataStore.selectedDispenser = undefined
  navigateTo({
    path: `/`,
  })
}

const extraItems: TopbarMenuItem[] = [
  {
    label: () => t('Settings'),
    icon: 'settings',
    to: '/settings',
  },
]

const items = [] as TopbarMenuItem[]

const itemsMobile = [
  [
    {
      label: () => t('base.home'),
      icon: 'home',
      onClick: goToHomepage,
    },
  ],
  items,
] as TopbarMenuItem[][]

</script>

<template>
  <QHeader
    bordered
    class="bg-primary !dark:bg-truegray-900 text-white select-none"
  >
    <QToolbar class="min-h-unset">
      <template v-if="sm">
        <QToolbarTitle shrink>
          <TopbarHomeButton />
        </QToolbarTitle>
        <NuxtLink
          v-for="(item, index) in items"
          :key="index"
          class="topbar-link"
          :href="toValue(item.to)"
        >
          <TopbarButton
            :label="toValue(item.label)"
            :disable="toValue(item.disabled)"
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
        <TopbarUser disable-theme :extra-items />
        <TopbarLoginButton />
      </div>
    </QToolbar>
  </QHeader>
</template>
