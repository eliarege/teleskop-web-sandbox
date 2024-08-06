<script setup>
import { useRouter } from 'vue-router'

const { t } = useI18n({ useScope: 'local' })

const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: false,
})
const fallbackPage = route.query.to
function goToMainPage() {
  router.push(fallbackPage || '/')
}
</script>

<template>
  <div class="unauthorized-container">
    <h1 class="header">
      {{ t('unauthorizedAccess') }}
    </h1>
    <p class="msg">
      {{ t('unauthorizedMessage') }}
    </p>
    <q-btn
      color="black"
      outline
      class="back-button mt-5"
      size="lg"
      font="bold"
      no-caps
      @click="goToMainPage"
    >
      {{ t('goToMainPage') }}
    </q-btn>
  </div>
</template>

<style scoped>
.unauthorized-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f8f9fa; /* Light background color */
  padding: 20px;
}

.header {
  font-size: 4rem;
  font-weight: bold;
}

.msg {
  font-size: 1.4rem;
  margin: 20px 0;
}
:deep(.back-button.q-btn--outline::before) {
  border-width: 3px;
}
</style>

<i18n lang="json">
  {
    "en": {
      "unauthorizedAccess": "Unauthorized Access",
      "unauthorizedMessage": "You don't have rights to access this page. Please contact with your supervisor or server admin.",
      "goToMainPage": "Go Back"
    },
    "tr": {
      "unauthorizedAccess": "Yetkisiz Erişim",
      "unauthorizedMessage": "Bu sayfaya ulaşmak için gerekli yetkilere sahip değilsiniz. Lütfen yöneticinizle veya sunucu admini ile iletişime geçiniz.",
      "goToMainPage": "Geri Dön"
    }
  }
</i18n>
