<script setup lang="ts">
import { useColorStore } from '~/store/Colors'

const colors = useColorStore()
const { t } = useI18n()
</script>

<template>
  <div class="color-picker flex flex-col gap-3 bg-gray-100 rounded m-1 px-2 py-1">
    <span class="settings-title inline-block mb-3">
      {{ t('settings.color-picker') }}
    </span>

    <div class="flex justify-start gap-3">
      <div>
        <span class="settings-sub-title inline-block mb-2px text-center">
          {{ t('settings.active-color') }}
        </span>
        <q-color v-model="colors.cardActiveBg" />
      </div>

      <div>
        <span class="settings-sub-title inline-block mb-2px text-center">
          {{ t('settings.inactive-color') }}
        </span>
        <q-color v-model="colors.cardIdleBg" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
  .color-picker {
  @apply at-lg:(flex text-black w-full h-min) lt-sm:(w-100vw flex gap-3);
}
</style>
