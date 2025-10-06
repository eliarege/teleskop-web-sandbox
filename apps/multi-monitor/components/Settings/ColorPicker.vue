<script setup lang="ts">
import { useColorStore } from '~/store/Colors'

const colors = useColorStore()
const { t } = useI18n()
</script>

<template>
  <div class="color-picker flex flex-col gap-3 bg-gray-100 rounded m-1 py-1">
    <span class="settings-title inline-block mb-3">
      {{ t('settings.color-picker') }}
    </span>

    <div class="w-min lg:(flex flex-row) md:flex sm:flex-col justify-start lg:gap-3 md:gap-3 sm:gap-4">
      <div class="flex-1">
        <span class="settings-sub-title inline-block mb-2px text-center">
          {{ t('settings.active-color') }}
        </span>
        <q-color v-model="colors.cardActiveBg" />
      </div>

      <div class="flex-1">
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
  @apply flex text-black w-full h-min;
}
</style>
