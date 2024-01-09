<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const emit = defineEmits(['logout'])
const dataStore = useDataStore()
const { t } = useI18n()

function logout() {
  emit('logout')
}
</script>

<template>
  <div class="q-pa-md">
    <div class="welcome-message">
      {{ `${t('Welcome')}, ${dataStore.user!.username}` }}
    </div>
    <div text-center>
      <QBtn
        class="border-rd-2"
        icon="logout"
        color="primary"
        @click="logout"
      >
        <QTooltip
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
        >
          {{ t('Log Out') }}
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
