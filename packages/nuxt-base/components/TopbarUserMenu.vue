<script setup lang="ts">
const keycloak = useKeycloak()
const { userProfile } = keycloak
const { t } = useI18n()

keycloak.onReady(() => {
  keycloak.loadUserProfile()
})

const label = computed(() => {
  return keycloak.authenticated.value
    ? keycloak.userProfile.value?.firstName
    : t('base.login')
})

const fullName = computed(() => {
  if (userProfile.value) {
    if (userProfile.value.lastName) {
      return `${userProfile.value.firstName} ${userProfile.value.lastName}`
    } else {
      return userProfile.value.firstName || t('base.guest')
    }
  } else {
    return t('base.guest')
  }
})

function onClick() {
  if (!keycloak.enabled)
    return
  if (!keycloak.authenticated.value) {
    keycloak.login()
  }
}
</script>

<template>
  <TopbarButton
    v-if="keycloak.enabled"
    :loading="!keycloak.didInitialise.value"
    icon="person"
    :label
    no-caps
    @click="onClick"
  >
    <QMenu
      :transition-duration="0"
      :target="keycloak.authenticated.value"
    >
      <QList class="min-w-50">
        <QItem class="q-item-avatar-dense py-4">
          <QItemSection avatar>
            <QAvatar color="primary" text-color="white">
              {{ fullName.charAt(0).toUpperCase() }}
            </QAvatar>
          </QItemSection>
          <QItemSection>
            <QItemLabel>{{ fullName }}</QItemLabel>
            <QItemLabel caption>
              {{ userProfile?.email }}
            </QItemLabel>
          </QItemSection>
        </QItem>
        <QSeparator />
        <QItem
          v-close-popup
          clickable
          class="whitespace-nowrap"
          @click="keycloak.logout"
        >
          <QItemSection avatar>
            <QIcon name="logout" />
          </QItemSection>
          <QItemSection>
            {{ t('base.logout') }}
          </QItemSection>
        </QItem>
      </QList>
    </QMenu>
  </TopbarButton>
</template>
