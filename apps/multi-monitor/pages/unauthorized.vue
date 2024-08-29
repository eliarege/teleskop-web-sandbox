<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()

definePageMeta({
  layout: 'vnc',
})
</script>

<template>
  <div class="w-full h-100vh">
    <FallBack
      :error-message="t('404.unauthorized')"
      :return-message="t('404.return')"
      @return="router.back()"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
