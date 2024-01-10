<script lang="ts" setup>
import type { User } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const dataStore = useDataStore()
const user = ref<User | null>()
user.value = dataStore.user
dataStore.$subscribe((_, data) => {
  user.value = data.user
})

dataStore.title = ''
</script>

<template>
  <div class="q-pa-md flex-center mt-50">
    <MainMenu v-if="user" />
    <LoginForm v-if="!user" />
  </div>
</template>
