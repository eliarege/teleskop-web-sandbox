<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tab = ref('material')
const splitterModel = ref(10)
const innerWidth = ref(window.innerWidth)
function handleResize() {
  innerWidth.value = window.innerWidth
}
useResizeObserver(document.body, () => {
  handleResize()
})
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
          v-model="tab"
          vertical
          style="color: rgb(0, 0, 0); width: 100%;"
          class="tab-overwrite"
        >
          <q-tab
            name="dispenser"
            icon="settings"
            style="white-space: normal;"
            :label="innerWidth > 768 ? `${t('settings.dispSettings._')}` : ''"
          />
          <q-separator />
          <q-tab
            name="machine-disp"
            icon="settings"
            style="white-space: normal;"
            :label="innerWidth > 768 ? `${t('settings.machDispConnection')}` : ''"
          />
          <q-separator />
          <q-tab
            name="material"
            icon="settings"
            style="white-space: normal;"
            :label="innerWidth > 768 ? `${t('settings.machMaterialConnection')}` : ''"
          />
          <q-separator />
          <q-tab
            name="request-mechanism"
            icon="settings"
            style="white-space: normal;"
            :label="innerWidth > 768 ? `${t('settings.requestMechanism._')}` : ''"
          />
          <q-separator />
          <q-tab
            name="driver-info"
            icon="settings"
            style="white-space: normal;"
            :label="innerWidth > 768 ? `${t('settings.driverInfo._')}` : ''"
          />
        </q-tabs>
      </template>

      <template #after>
        <q-tab-panels
          v-model="tab"
          animated
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel name="dispenser">
            <SettingsDispenser />
          </q-tab-panel>

          <q-tab-panel name="machine-disp">
            <SettingsMachineDispenserConnection />
          </q-tab-panel>

          <q-tab-panel name="material">
            <SettingsMaterial />
          </q-tab-panel>

          <q-tab-panel class="e-border" name="request-mechanism">
            <SettingsRequestMechanism />
          </q-tab-panel>

          <q-tab-panel name="driver-info">
            <SettingsDriverInfo />
          </q-tab-panel>
        </q-tab-panels>
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
