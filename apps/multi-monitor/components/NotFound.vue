<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="wrapper">
    <div class="notfound">
      <img src="/eliarkurumsal.png">
      <div class="warningtext">
        {{ t('404.message') }}
        <ElButton
          color="#0d94fc"
          plain
          @click="router.back()"
        >
          {{ t('404.return') }}
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  @apply flex w-full h-full justify-center;
}
.notfound {
  @apply flex flex-col p-3 rounded-2xl justify-center;
}
.warningtext {
  @apply w-auto h-35 flex flex-col justify-center items-center text-center text-black font-extrabold;
}
.btn {
  @apply bg-gray-700 rounded-xl w-35 h-7 text-white;
}
.btn:hover {
  @apply bg-gray-800 shadow shadow-gray-500/50 shadow-lg;
}
</style>
