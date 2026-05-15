<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useRouter } from '#imports'
import { useDataStore } from '~/store/DataStore'

const { t, locale } = useI18n()
const dataStore = useDataStore()
const router = useRouter()
const tab = ref('s1')
const splitterModel = ref(10)
const innerWidth = ref(window.innerWidth)
const minSize = 1100

dataStore.title = t('Settings')
watch(locale, () => {
  dataStore.title = t('Settings')
})
function handleResize() {
  innerWidth.value = window.innerWidth
}
useResizeObserver(document.body, () => {
  handleResize()
})
</script>

<template>
  <QSplitter
    class="min-h-inherit"
    after-class="min-h-inherit"
    v-model="splitterModel"
  >
    <template #before>
      <div flex-center>
        <QBtn
          flat
          icon="arrow_back"
          class="min-h-20 w-full"
          @click="router.back"
        >
          <QTooltip
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('GoBack') }}
          </QTooltip>
        </QBtn>
      </div>
      <QSeparator />
      <QTabs
        v-model="tab"
        vertical
        style="color: rgb(0, 0, 0); width: 100%;"
      >
        <QTab
          name="s2"
          icon="science"
          :class="tab === 's2' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Material')}` : ''"
        >
          <QTooltip
            v-if="innerWidth <= minSize"
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('settings.Material') }}
          </QTooltip>
        </QTab>
        <QSeparator />
        <QTab
          name="s3"
          icon="settings"
          :class="tab === 's3' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Machine')}` : ''"
        />
        <QTooltip
          v-if="innerWidth <= minSize"
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
        >
          {{ t('settings.Machine') }}
        </QTooltip>
        <QSeparator />
        <QTab
          name="s4"
          icon="propane_tank"
          :class="tab === 's4' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Tank')}` : ''"
        />
        <QTooltip
          v-if="innerWidth <= minSize"
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
        >
          {{ t('settings.Tank') }}
        </QTooltip>
        <QSeparator />
        <QTab
          v-if="false"
          name="s5"
          icon="terminal"
          :class="tab === 's5' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Program')}` : ''"
        >
          <QTooltip
            v-if="innerWidth <= minSize"
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('settings.Program') }}
          </QTooltip>
        </QTab>
        <QSeparator />
        <QTab
          name="s6"
          icon="content_paste_search"
          :class="tab === 's6' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.General')}` : ''"
        >
          <QTooltip
            v-if="innerWidth <= minSize"
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('settings.General') }}
          </QTooltip>
        </QTab>
        <QSeparator />
        <QTab
          name="s7"
          icon="backup"
          :class="tab === 's7' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Database')}` : ''"
        >
          <QTooltip
            v-if="innerWidth <= minSize"
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('settings.Database') }}
          </QTooltip>
        </QTab>
        <QSeparator />
        <QTab
          name="s8"
          icon="list"
          :class="tab === 's8' ? 'tabs-active' : 'tabs'"
          :label="innerWidth > minSize ? `${t('settings.Other')}` : ''"
        >
          <QTooltip
            v-if="innerWidth <= minSize"
            :offset="[10, 10]"
            anchor="center right"
            self="center left"
          >
            {{ t('settings.Other') }}
          </QTooltip>
        </QTab>
        <QSeparator />
      </QTabs>
    </template>

    <template #after>
      <QTabPanels
        v-model="tab"
        vertical
        class="h-0 min-h-inherit overflow-auto"
      >
        <QTabPanel name="s2">
          <SettingsMaterial />
        </QTabPanel>

        <QTabPanel name="s3">
          <SettingsMachine />
        </QTabPanel>

        <QTabPanel name="s4">
          <SettingsTank />
        </QTabPanel>

        <QTabPanel name="s5">
          <SettingsProgram />
        </QTabPanel>

        <QTabPanel name="s6">
          <SettingsGeneral />
        </QTabPanel>

        <QTabPanel name="s7">
          <SettingsDatabase />
        </QTabPanel>
        <QTabPanel name="s8">
          <SettingsOther />
        </QTabPanel>
      </QTabPanels>
    </template>
  </QSplitter>
</template>
