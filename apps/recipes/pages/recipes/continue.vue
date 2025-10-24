<script lang="ts" setup>
import { useDataStore } from '~/store/DataStore'

const { t } = useI18n()
const dataStore = useDataStore()

dataStore.title = t('ContinueRecipes')
</script>

<template>
  <RecipeList
    :is-batch="false"
  />
</template>
