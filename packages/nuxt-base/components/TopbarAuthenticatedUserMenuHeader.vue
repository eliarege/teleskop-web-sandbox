<script setup lang="ts">
const keycloak = useKeycloak()
const { userProfile } = keycloak
const { t } = useI18n()

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
</script>

<template>
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
</template>
