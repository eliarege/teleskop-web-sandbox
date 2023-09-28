<script setup lang="ts">
import { useI18n } from 'vue-i18n'

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
          <span class="flex text-center text-2xl opacity-70">{{
            t("load-message")
          }}</span>
          <span class="flex text-center text-xl opacity-50">{{
            t("wait-message")
          }}</span>
          <span class="loader" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loader {
  border-color: #212121 #212121 transparent transparent;
  animation: rotation 1s linear infinite;
  @apply w-48px h-48px rounded-1/2 inline-block relative border-3px box-border;
}
.loader::after,
.loader::before {
  border-color: transparent transparent #0d94fc #0d94fc;
  animation: rotationBack 0.5s linear infinite;
  transform-origin: center center;
  content: '';
  @apply absolute left-0 right-0 top-0 bottom-0 m-auto border-3px box-border w-40px h-40px rounded-1/2;
}
.loader::before {
  border-color: #212121 #212121 transparent transparent;
  animation: rotation 1.5s linear infinite;
  @apply w-32px h-32px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}
</style>
