<script setup lang="ts">
const keycloak = useKeycloak()
const { t } = useI18n()
const { authenticated, didInitialise } = useKeycloak()
</script>

<template>
  <TopbarButton
    v-if="keycloak.enabled && didInitialise && !authenticated"
    icon="person"
    :label="t('base.login')"
    no-caps
    @click="keycloak.login()"
  />
</template>
