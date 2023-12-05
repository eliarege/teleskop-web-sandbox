<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { colors } from '~/shared/constants'

const { t } = useI18n()
</script>

<template>
  <span class="header-class">
    Eliar - {{ t('distributionProcessor.a') }}
    <img
      src="/eliarname.png"
      class="invert-colors"
      style="display: flex; right: 1rem; position: absolute; height: 3rem; width: 3rem;"
    >
  </span>
  <DagitimYonetim />
</template>

<style scoped lang="postcss">
.buttons {
  margin-top: 20vh;
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
}
img.invert-colors {
  filter: invert(1);
}
.header-class {
  background-color: rgb(0, 0, 0);
  color: white;
  font-size: x-large;
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 3rem;
}
</style>
