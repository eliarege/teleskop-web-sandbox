<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'

const { t } = useI18n()
</script>

<template>
  <div
    class="w-full h-screen text-black flex justify-center items-center select-none"
  >
    <div class="flex flex-col justify-center w-full sm:w-1/3 md:w-1/2">
      <div class="sm:p-50 md:p-35 e-border shadow shadow-2xl rounded-2xl">
        <div class="flex flex-col justify-center items-center">
          <img src="/eliarkurumsal.png">
          <span class="flex text-center text-4xl opacity-90">{{
            t("error-message")
          }}</span>
          <span class="flex text-center text-2xl opacity-70">{{
            t("error-message-middle")
          }}</span>
          <span class="flex text-center text-xl opacity-50">{{
            t("error-message-last")
          }}</span>
          <Icon
            icon="icon-park:six-circular-connection"
            width="60"
            height="60"
            class="rotate-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rotate-center {
  animation: rotate-center 5s linear infinite both;
}
@keyframes rotate-center {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
