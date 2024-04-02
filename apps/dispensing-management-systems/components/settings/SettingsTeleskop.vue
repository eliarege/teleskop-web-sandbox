<script setup lang="ts">
import type { DatabaseConnection } from '~/shared/types'
import { connectTeleskopDB } from '~/server/connectionPool'

const { t } = useI18n()
const q = useQuasar()
const { notifySuccess, notifyFail } = useNotify()
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
</script>

<template>
  <div>
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
                  dense
                  type="text"
                  filled
                />
              </div>
              <div class="row-item">
                {{ t('protocolParameters.dbHostComputer') }}
                <QInput
                  v-model="teleskopSettings!.hostComputer"
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
                  dense
                  type="text"
                  filled
                />
              </div>
              <div class="row-item">
                {{ t('protocolParameters.dbHost') }}
                <QInput
                  v-model="teleskopSettings!.host"
                  dense
                  type="text"
                  filled
                />
              </div>
            </div>
            <div class="flex flex-row flex-center">
              <div class="row-item">
                {{ t('protocolParameters.dbPort') }}
                <QInput
                  v-model="teleskopSettings!.port"
                  class="select-item"
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
    </div>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  height: 100vh;
  overflow-y: auto;
}
.buttons-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
  position: sticky;
  bottom: 0;
  width: 88%;
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
</style>
