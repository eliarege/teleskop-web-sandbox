<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { breakpoints } from '~/shared/constants'

const { t } = useI18n()
const tempRoute = useRoute()

const tabRef = computed(() => tempRoute.fullPath.split('/')[2] || 'material')
const splitterModel = ref(10)
const isLaptop = useBreakpoints(breakpoints).greaterOrEqual('laptop')
const settings = [
  { name: 'dispenser', label: t('settings.dispSettings._'), icon: 'settings' },
  { name: 'machine-connection', label: t('settings.machDispConnection'), icon: 'settings' },
  { name: 'material', label: t('settings.machMaterialConnection'), icon: 'settings' },
  { name: 'request-mechanism', label: t('settings.requestMechanism._'), icon: 'settings' },
  { name: 'driver', label: t('settings.driverInfo._'), icon: 'settings' },
]
</script>

<template>
  <span class="header-class">
    <NavigationButton type="back" />
    &nbsp;&nbsp;
    Eliar - {{ t('distributionProcessor._') }} - {{ t('settings._') }}
    <span class="right-home">
      <NavigationButton type="home" />
    </span>
  </span>
  <div>
    <q-splitter
      v-model="splitterModel"
    >
      <template #before>
        <q-tabs
          :model-value="tabRef"
          vertical
          style="color: rgb(0, 0, 0); width: 100%;"
          class="tab-overwrite"
        >
          <RouterLink
            v-for="set in settings"
            :key="set.name"
            :to="`/settings/${set.name}`"
          >
            <q-tab
              :name="set.name"
              :icon="set.icon"
              :class="tabRef === set.name ? 'selected-tab' : 'tab-class'"
              :label="isLaptop ? set.label : ''"
            />
            <q-separator />
          </RouterLink>
        </q-tabs>
      </template>

      <template #after>
        <NuxtPage />
      </template>
    </q-splitter>
  </div>
</template>

<style scoped>
/* Mobile view */
@media (max-width: 600px) {

  .header-class {
  font-size: medium !important;
}

}

.selected-tab {
  background-color: black;
  color: white;
  white-space: normal;
}

.tab-class {
  background-color: white;
  color: black;
  white-space: normal;
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
.right-home {
  position: absolute;
  right: 0;
}
.tab-overwrite :deep(.q-tab__label) {
  font-weight: bold !important;
}
.q-tab--full{
  min-height: 8rem;
}
img.invert-colors {
  filter: invert(1);
}
</style>
