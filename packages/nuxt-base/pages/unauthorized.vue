<script setup lang="ts">
import type { RouteRecordNormalized } from 'vue-router'

definePageMeta({
  layout: false,
  noAuth: true,
})

const { t } = useI18n({ useScope: 'local' })

const route = useRoute()
const router = useRouter()
const appList = useAppList()
const kcConfig = useAppConfig().keycloak || {}
const keycloak = useKeycloak()
const rootRoute = router.getRoutes().find(r => r.path === '/')

function isAuthorizedRoute(route: RouteRecordNormalized) {
  return route.meta.noAuth || (
    (!kcConfig.accessRole || keycloak.hasResourceRole(kcConfig.accessRole))
    && (!route.meta.roles?.length || route.meta.roles.some(r => keycloak.hasResourceRole(r)))
  )
}

const returnUrl = computed(() => {
  if (typeof route.query.back === 'string') {
    return { to: route.query.back, external: false }
  }
  if (rootRoute && isAuthorizedRoute(rootRoute)) {
    return { to: rootRoute.path, external: false }
  }
  const rootUrl = appList.find(a => a.name === 'root')?.url
  if (rootUrl) {
    return { to: rootUrl, external: true }
  }

  return null
})
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
      v-if="returnUrl"
      color="black"
      outline
      class="back-button font-bold mt-5"
      size="lg"
      no-caps
    >
      <nuxt-link
        :to="returnUrl.to"
        :external="returnUrl.external"
      >
        {{ t('goBack') }}
      </nuxt-link>
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
      "goBack": "Go Back"
    },
    "tr": {
      "unauthorizedAccess": "Yetkisiz Erişim",
      "unauthorizedMessage": "Bu sayfaya ulaşmak için gerekli yetkilere sahip değilsiniz. Lütfen yöneticinizle veya sunucu admini ile iletişime geçiniz.",
      "goBack": "Geri Dön"
    },
    "pt": {
      "unauthorizedAccess": "Acesso Não Autorizado",
      "unauthorizedMessage": "Você não tem permissão para acessar esta página. Por favor, entre em contato com seu supervisor ou administrador do servidor.",
      "goBack": "Voltar"
    }
  }
</i18n>
