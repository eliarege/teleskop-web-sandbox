<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const { t } = useI18n()
const { dark } = useQuasar()
const dataStore = useDataStore()
const cookie = useCookie<'auto' | boolean>('dark')
dark.set(cookie.value ?? 'auto')
watch(
  () => dark.mode,
  mode => cookie.value = mode,
)
function goToHomepage() {
  dataStore.selectedDispenser = undefined
  navigateTo({
    path: `/`,
  })
}
function goToSettings() {
  navigateTo({
    path: `/settings`,
  })
}
</script>

<template>
  <QHeader class="text-white" bordered>
    <div>
      <QBtn
        flat
        style="display: flex; left: 1rem; position: absolute; height: 3rem; width: 3rem; z-index: 1;"
        @click="goToHomepage"
      >
        <QTooltip :offset="[10, 10]">
          {{ t('Homepage') }}
        </QTooltip>
        <QAvatar size="42px">
          <img src="/eliar_logo.png">
        </QAvatar>
      </QBtn>
    </div>
    <div>
      <QToolbar :class="dark.isActive ? 'bg-black' : 'bg-primary'">
        <QSpace />
        <h3 v-if="dataStore">
          {{ dataStore.title }}
        </h3>
        <QSpace />
        <QBtn
          flat
          class="h-6 w-6"
          icon="settings"
          @click="goToSettings"
        >
          <QTooltip :offset="[10, 10]">
            {{ t('Settings') }}
          </QTooltip>
        </QBtn>
        <QToggle
          flat
          color="dark"
          :model-value="dark.isActive"
          checked-icon="dark_mode"
          unchecked-icon="light_mode"
          @update:model-value="dark.set($event)"
        >
          <QTooltip :offset="[10, 10]">
            {{ t('Theme') }}
          </QTooltip>
        </QToggle>
      </QToolbar>
    </div>
  </QHeader>
</template>
