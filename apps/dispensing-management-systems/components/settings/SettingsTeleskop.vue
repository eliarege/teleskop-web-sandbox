<script setup lang="ts">
import type { DatabaseConnection } from '~/shared/types'
import { connectTeleskopDB } from '~/server/connectionPool'
import { useStateStore } from '~/store/State'
import ipformat from '~/shared/utils'

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const stateStore = useStateStore()
const { data: defaultSettings } = await useFetch<DatabaseConnection>('/api/teleskop/parameters')
const teleskopSettings = ref<DatabaseConnection>()
teleskopSettings.value = { ...defaultSettings.value }

const passwordVisible = ref(false)

async function onSave() {
  try {
    const connection = teleskopSettings.value
    await $fetch(`/api/teleskop/parameters`, { method: 'PUT', body: connection })
    connectTeleskopDB(connection)
    notifySuccess(t('Success'))
  } catch (e) {
    notifyFail(t('Failed'))
  }
}

function onReset() {
  teleskopSettings.value = { ...defaultSettings.value }
}
async function pingAddress() {
  try {
    stateStore.isLoading = true
    await $fetch(`http://${teleskopSettings.value?.host}`, {
      mode: 'no-cors',
      timeout: 3000,
    })
    notifySuccess(t('Success'))
  } catch (e) {
    console.error(e)
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}
async function onConnectionCheck() {
  try {
    stateStore.isLoading = true
    await $fetch('/api/teleskop/test-connection', { method: 'POST', body: { connection: {
      client: teleskopSettings.value?.client,
      user: teleskopSettings.value?.user,
      password: teleskopSettings.value?.password,
      host: teleskopSettings.value?.host,
      port: teleskopSettings.value?.port,
      database: teleskopSettings.value?.database,
    } } })
    notifySuccess(t('Success'))
  } catch (e) {
    console.error(e)
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}
</script>

<template>
  <div class="content-section">
    <QForm @submit.prevent>
      <div class="align-start justify-center">
        <div class="text-xl flex flex-center">
          {{ t('settings.Teleskop') }}
        </div>
        <div class="flex-center flex-col text-size-4 w-full ">
          <div class="flex flex-row flex-center">
            <div class="row-item">
              <span class="w-24">
                {{ t('protocolParameters.dbClient') }}
              </span>
              <QInput
                v-model="teleskopSettings!.client"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item">
              {{ t('protocolParameters.dbHostComputer') }}
              <QInput
                v-model="teleskopSettings!.hostComputer"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
          </div>
          <div class="flex flex-row flex-center">
            <div class="row-item">
              {{ t('protocolParameters.dbName') }}
              <QInput
                v-model="teleskopSettings!.database"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item">
              {{ t('protocolParameters.dbHost') }}
              <QInput
                v-model="teleskopSettings!.host"
                class="input"
                dense
                type="text"
                hide-bottom-space
                filled
                :rules="[(val: string) => val !== null && val.match(ipformat) && val !== '' || '']"
              >
                <template #append>
                  <QBtn round dense flat icon="wifi" @click="pingAddress" />
                </template>
              </QInput>
            </div>
          </div>
          <div class="flex flex-row flex-center">
            <div class="row-item">
              {{ t('protocolParameters.dbPort') }}
              <QInput
                v-model.number="teleskopSettings!.port"
                class="input"
                dense
                filled
                type="number"
                min="0"
                hide-bottom-space
                :rules="[(val: number) => val >= 0]"
              />
            </div>

            <div class="row-item">
              {{ t('protocolParameters.dbUser') }}
              <QInput
                v-model="teleskopSettings!.user"
                class="input"
                dense
                type="text"
                filled
              />
            </div>
          </div>
          <div class="row-item">
            {{ t('protocolParameters.dbPassword') }}
            <QInput
              v-model="teleskopSettings!.password"
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
      <div class="flex-center justify-evenly">
        <QBtn
          :label="t('Save')"
          color="primary"
          icon="save"
          mr-2
          @click="onSave"
        />
        <QBtn
          :label="t('Reset')"
          icon="refresh"
          ml-2
          @click="onReset"
        />
        <QBtn
          :label="t('ConnectionCheck')"
          color="secondary"
          icon="wifi_tethering"
          ml-2
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
}
.buttons-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
  bottom: 0;
  background-color: white;
}
.body--dark .buttons-section {
  background-color: var(--q-dark);
}
.row-item {
  align-items: center;
  gap: 1rem;
  margin: 2rem;
}
.input {
  width: 25rem;
}
</style>
