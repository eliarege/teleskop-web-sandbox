<script setup lang="ts">
import { useColorStore } from '~/store/Colors'
import { useDataStore } from '~/store/Datas'

const emits = defineEmits(['close'])
const { t } = useI18n()
const store = useDataStore()
const colors = useColorStore()

function setDefaultSettings() {
  colors.cardActiveBg = '#4B5563'
  colors.cardIdleBg = '#D1D5DB'
  colors.cardItemBg = '#000000'
  colors.bgColor = '#FFFFFF'
  colors.textcolor = '#000000'
  store.mode = true
  store.electricity = true
  store.steam = true
  store.salt = true
  store.water = true
  store.scrollSpeed = 3
  store.zoomLevel = 1

  store.erpKeys = store.machines.map(m => ({ id: m.id, key: Object.keys(m.erp ?? {})[0] })).sort((a, b) => a.id > b.id ? 1 : -1)
  store.customSort.sort((a, b) => a > b ? 1 : -1)
}
</script>

<template>
  <div class="max-w-full min-w-full w-full h-full bg-white">
    <div class="rounded">
      <div class="flex border-b-1">
        <span class="settings-title text-center">
          {{ t('settings._') }}
        </span>
        <q-space />
        <q-btn
          icon="close"
          dense
          :outline="false"
          no-wrap
          flat
          rounded
          @click="emits('close')"
        />
      </div>

      <div class="px-45 w-full h-full overflow-auto max-h-[calc(100vh-134px)]">
        <div class="h-full w-auto flex flex-col w-full">
          <!-- Makine Ayarları -->
          <SettingsMachine />
          <q-separator class="my-10" />
          <!-- Görsel Ayarlar -->
          <SettingsVisual />
          <q-separator class="my-10" />
          <!-- Renk seçici -->
          <SettingsColorPicker />
          <q-separator class="my-10" />
          <!-- Animasyon -->
          <SettingsAnimation />
        </div>
      </div>
    </div>
    <div class="flex justify-end px-3 py-1 border-t-1">
      <q-btn
        color="primary"
        outline
        class="!border-1 !border-primary"
        label="Varsayılan Ayarlar"
        no-caps
        push
        @click="setDefaultSettings()"
      />
    </div>
  </div>
</template>

<style lang="postcss">
.settings-title {
  font-weight: 700;
  @apply text-xl px-1 py-2;
}
.settings-sub-title {
  font-weight: 500;
  @apply text-l px-1 py-2;
}
</style>
