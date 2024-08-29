<script setup lang="ts">
definePageMeta({
  noAuth: true,
})
const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="w-full h-100vh e-border">
    <FallBack
      :error-message="t('404.message')"
      :return-message="t('404.return')"
      @return="() => router.push('/')"
    />
  </div>
</template>
