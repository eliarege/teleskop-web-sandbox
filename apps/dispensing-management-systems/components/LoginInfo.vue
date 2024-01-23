<script lang="ts" setup>
const { userProfile, loadUserProfile, logout } = useKeycloak()
loadUserProfile()

const emit = defineEmits(['logout'])
const { t } = useI18n()

function onLogout() {
  emit('logout')
  logout()
}
</script>

<template>
  <div class="q-pa-md">
    <div class="welcome-message">
      {{ `${t('Welcome')}, ${userProfile?.username}` }}
    </div>
    <div text-center>
      <QBtn
        class="border-rd-2"
        icon="logout"
        color="primary"
        @click="onLogout"
      >
        <QTooltip
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
        >
          {{ t('LogOut') }}
        </QTooltip>
      </QBtn>
    </div>
  </div>
</template>

<style scoped>
  .welcome-message {
    text-align: center;
    margin-bottom: 1rem;
    font-family: sans-serif;
    font-size: 16px;
  }
</style>
