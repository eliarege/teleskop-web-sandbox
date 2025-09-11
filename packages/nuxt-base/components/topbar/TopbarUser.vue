<script setup lang="ts">
import type { TopbarMenuItem } from '../../types'

defineProps<{
  extraItems?: TopbarMenuItem[]
  disableTheme?: boolean
}>()
const keycloak = useKeycloak()
const { t } = useI18n()
const { didInitialise, authenticated } = keycloak
const tt = (key: string) => toRef(() => t(key))

// Sometimes due to werd timing, we miss keycloak.onReady hook. This is more robust.
watch(keycloak.ready, (ready) => {
  if (ready && authenticated.value) {
    keycloak.loadUserProfile()
  }
}, { immediate: true })

const label = computed(() => {
  return keycloak.authenticated.value
    ? keycloak.userProfile.value?.firstName
    : t('base.guest')
})

const logoutButton: TopbarMenuItem = {
  label: tt('base.logout'),
  icon: 'logout',
  onClick: () => keycloak.logout(),
}

const profileButton: TopbarMenuItem = {
  label: tt('base.profile'),
  icon: 'person',
  onClick: () => navigateTo(keycloak.createAccountUrl(), {
    external: true,
  }),
}
</script>

<template>
  <TopbarButton
    v-if="keycloak.enabled && (!didInitialise || authenticated)"
    :loading="!didInitialise"
    icon="person"
    :label
    no-caps
  >
    <QMenu
      :transition-duration="0"
      :target="authenticated"
    >
      <TopbarAuthenticatedUserMenuHeader />
      <QSeparator class="my-1" />
      <TopbarMenuItem :item="profileButton" />
      <TopbarMenuItem :item="logoutButton" />
      <QSeparator class="my-1" />
      <TopbarCommonSettings :disable-theme :extra-items />
    </QMenu>
  </TopbarButton>
  <TopbarButton
    v-if="!keycloak.enabled || (didInitialise && !authenticated)"
    icon="more_vert"
    round
  >
    <QMenu :transition-duration="0">
      <TopbarCommonSettings :disable-theme :extra-items />
    </QMenu>
  </TopbarButton>
</template>

<style scoped lang="postcss">
</style>
