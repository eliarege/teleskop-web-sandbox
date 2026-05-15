<script setup lang="ts">
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { DatabaseConnection } from '~/shared/types'
import { useStateStore } from '~/store/State'

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const stateStore = useStateStore()

const tab = ref<'teleskop' | 'dmexchange'>('teleskop')

const { data: defaultTeleskopSettings } = await useFetch<DatabaseConnection>('/api/database/parameters', { query: { type: 'teleskop' } })
const { data: defaultDmExchangeSettings } = await useFetch<DatabaseConnection>('/api/database/parameters', { query: { type: 'dmexchange' } })

const formRef = ref()
const teleskopSettings = ref<DatabaseConnection>(klona(defaultTeleskopSettings.value))
const dmExchangeSettings = ref<DatabaseConnection>(klona(defaultDmExchangeSettings.value))
const passwordVisible = ref(false)

const selectedSettings = computed(() => (tab.value === 'teleskop' ? teleskopSettings.value : dmExchangeSettings.value))

const hasChanges = computed(() => {
  return (
    JSON.stringify(teleskopSettings.value) !== JSON.stringify(defaultTeleskopSettings.value)
    || JSON.stringify(dmExchangeSettings.value) !== JSON.stringify(defaultDmExchangeSettings.value)
  )
})

async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid)
    return
  try {
    await $fetch('/api/database/parameters', { method: 'PUT', body: selectedSettings.value , query: { type: tab.value }})
    notifySuccess(t('Success'))
  } catch (e) {
    notifyFail(t('Failed'))
  }
}

function onReset() {
  if (hasChanges.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.Reset'),
        confirmBtn: { label: t('Confirm'), color: 'positive', icon: 'done' },
        cancelBtn: { label: t('Cancel'), icon: 'close' },
      },
    }).onOk(() => {
      if (tab.value === 'teleskop') {
        teleskopSettings.value = klona(defaultTeleskopSettings.value)
      } else {
        dmExchangeSettings.value = klona(defaultDmExchangeSettings.value)
      }
    })
  }
}

async function pingAddress() {
  try {
    stateStore.isLoading = true
    await $fetch('/api/ping', { method: 'POST', body: { address: selectedSettings.value?.host } })
    notifySuccess(t('Success'))
  } catch (e) {
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}

async function onConnectionCheck() {
  try {
    stateStore.isLoading = true
    await $fetch(`/api/database/test-connection`, { method: 'POST', body: { connection: selectedSettings.value } })
    notifySuccess(t('Success'))
  } catch (e) {
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="text-xl">
      {{ t('settings.Database') }}
    </div>
  </div>
  <QSeparator class="w-full mt-5 mb-5" />

  <div class="q-gutter-y-md">
    <QTabs
      v-model="tab"
      class="tabs-border"
      dense
      align="justify"
      :breakpoint="0"
    >
      <QTab
        name="teleskop"
        label="Teleskop"
        no-caps
        :class="tab === 'teleskop' ? 'tabs-active' : 'tabs'"
      />
      <QSeparator vertical />
      <QTab
        name="dmexchange"
        label="DmExchange"
        no-caps
        :class="tab === 'dmexchange' ? 'tabs-active' : 'tabs'"
      />
    </QTabs>
  </div>

  <div class="content-section">
    <QForm ref="formRef" @submit.prevent>
      <div class="flex flex-col items-center">
        <div class="flex flex-col items-center text-size-4 w-full">
          <div class="flex flex-row flex-center">
            <div class="row-item-db">
              <span class="w-24">{{ t('protocolParameters.dbClient') }}</span>
              <QInput
                v-model="selectedSettings.client"
                class="input"
                dense
                type="text"
                filled
                disable
              />
            </div>
            <div class="row-item-db">
              {{ t('protocolParameters.dbHostComputer') }}
              <QInput
                v-model="selectedSettings.hostComputer"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
          </div>
          <div class="flex flex-row flex-center">
            <div class="row-item-db">
              {{ t('protocolParameters.dbName') }}
              <QInput
                v-model="selectedSettings.database"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item-db">
              {{ t('protocolParameters.dbHost') }}
              <QInput
                v-model="selectedSettings.host"
                class="input"
                dense
                type="text"
                filled
                hide-bottom-space
              >
                <template #append>
                  <QBtn
                    round
                    dense
                    flat
                    icon="wifi"
                    @click="pingAddress"
                  />
                </template>
              </QInput>
            </div>
          </div>
          <div class="flex flex-row flex-center">
            <div class="row-item-db">
              {{ t('protocolParameters.dbPort') }}
              <QInput
                v-model.number="selectedSettings.port"
                class="input"
                dense
                filled
                type="number"
                min="0"
              />
            </div>
            <div class="row-item-db">
              {{ t('protocolParameters.dbUser') }}
              <QInput
                v-model="selectedSettings.user"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
          </div>
          <div class="row-item-db">
            {{ t('protocolParameters.dbPassword') }}
            <QInput
              v-model="selectedSettings.password"
              class="input"
              dense
              :type="passwordVisible ? 'text' : 'password'"
              filled
            >
              <template #append>
                <QIcon
                  :name="passwordVisible ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="passwordVisible = !passwordVisible"
                />
              </template>
            </QInput>
          </div>
        </div>
      </div>
    </QForm>
    <div class="buttons-section">
      <div class="flex justify-center items-center justify-evenly space-x-2">
        <QBtn
          :label="t('Save')"
          color="primary"
          icon="save"
          type="submit"
          @click="onSave"
        />
        <QBtn
          :label="t('Reset')"
          icon="refresh"
          @click="onReset"
        />
        <QBtn
          :label="t('ConnectionCheck')"
          color="secondary"
          icon="wifi_tethering"
          @click="onConnectionCheck"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  flex: 1;
  overflow-y: auto;
  margin-top: 2.5rem;
}
.buttons-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
  background-color: white;
}
.body--dark .buttons-section {
  background-color: var(--q-dark);
}
.row-item-db {
  align-items: center;
  gap: 1rem;
  margin: 2rem;
}
.input {
  width: 25rem;
}
</style>
