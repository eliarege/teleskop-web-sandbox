<script setup lang="ts">
import { useColorStore } from '~/store/Colors'

const colors = useColorStore()
const { t } = useI18n()
</script>

<template>
  <div class="color-picker flex p-2 gap-3">
    <div class="flex-center flex-col">
      <span class="font-extrabold text-center">
        {{ t('settings.active-color') }}
      </span>
      <q-color v-model="colors.cardActiveBg" class="my-picker" />
    </div>
    <div class="flex-center flex-col">
      <span class="font-extrabold text-center">
        {{ t('settings.inactive-color') }}
      </span>
      <q-color
        v-model="colors.cardIdleBg"
        class="my-picker"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
  .color-picker {
    @apply at-lg:(flex-center text-black font-extrabold w-full h-full) lt-sm:(w-100vw flex-center gap-3);
  }
</style>
