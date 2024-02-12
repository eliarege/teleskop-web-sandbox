<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useRouter } from '#vue-router'
import { useDataStore } from '~/store/DataStore'

const { t, locale } = useI18n()
const q = useQuasar()
const dataStore = useDataStore()
const router = useRouter()
const tab = ref('s1')
const splitterModel = ref(10)
const innerWidth = ref(window.innerWidth)
const minSize = 768

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
  <div>
    <QSplitter
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
            name="s1"
            icon="settings"
            :class="tab === 's1' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
            :label="innerWidth > minSize ? `${t('settings.App')}` : ''"
          >
            <QTooltip
              v-if="innerWidth <= minSize"
              :offset="[10, 10]"
              anchor="center right"
              self="center left"
            >
              {{ t('settings.App') }}
            </QTooltip>
          </QTab>
          <QSeparator />
          <QTab
            name="s2"
            icon="settings"
            :class="tab === 's2' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
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
            :class="tab === 's3' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
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
            icon="settings"
            :class="tab === 's4' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
            :label="innerWidth > minSize ? `${t('settings.4')}` : ''"
          />
          <QSeparator />
          <QTab
            name="s5"
            icon="settings"
            :class="tab === 's5' ? (q.dark.isActive ? 'tabs-dark-active' : 'tabs-light-active') : (q.dark.isActive ? 'tabs-dark' : 'tabs-light')"
            :label="innerWidth > minSize ? `${t('settings.5')}` : ''"
          />
          <QSeparator />
        </QTabs>
      </template>

      <template #after>
        <QTabPanels
          v-model="tab"
          animated
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <QTabPanel name="s1">
            <AppSettings />
          </QTabPanel>

          <QTabPanel name="s2">
            <MaterialSettings />
          </QTabPanel>

          <QTabPanel name="s3">
            <MachineSettings />
          </QTabPanel>

          <QTabPanel name="s4">
            <!-- Settings Component -->
          </QTabPanel>

          <QTabPanel name="s5">
            <!-- Settings Component -->
          </QTabPanel>
        </QTabPanels>
      </template>
    </QSplitter>
  </div>
</template>
