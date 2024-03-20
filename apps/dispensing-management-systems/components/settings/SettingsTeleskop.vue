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
        <div class="flex flex-row align-start justify-center">
          <div class="text-xl">
            {{ t('settings.Teleskop') }}
          </div>
          <QSeparator
            class="w-full mt-10 mb-10"
          />
          <div class="flex-center flex-col gap-5 text-size-4 w-full ">
            <div class="row-item">
              {{ t('protocolParameters.dbClient') }}
              <QInput
                v-model="teleskopSettings!.client"
                dense
                type="text"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
            <div class="row-item">
              {{ t('protocolParameters.dbHostComputer') }}
              <QInput
                v-model="teleskopSettings!.hostComputer"
                dense
                type="text"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
            <div class="row-item">
              {{ t('protocolParameters.dbName') }}
              <QInput
                v-model="teleskopSettings!.database"
                dense
                type="text"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
            <div class="row-item">
              {{ t('protocolParameters.dbHost') }}
              <QInput
                v-model="teleskopSettings!.host"
                dense
                type="text"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
            <div class="row-item">
              {{ t('protocolParameters.dbPort') }}
              <QInput
                v-model="teleskopSettings!.port"
                dense
                type="number"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
            <div class="row-item">
              {{ t('protocolParameters.dbUser') }}
              <QInput
                v-model="teleskopSettings!.user"
                dense
                type="text"
                filled
              />
            </div>
            <QSeparator
              class="w-full "
            />
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
            <QSeparator
              class="w-full "
            />
          </div>
        </div>
      </QForm>
    </div>
    <div :class="q.dark.isActive ? 'buttons-section-dark' : 'buttons-section-light'">
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
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.content-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10vh;
}

.buttons-section-light {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
  position: fixed;
  bottom: 0;
  width: 88%;
  background-color: white;
}
.buttons-section-dark {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh;
  position: fixed;
  bottom: 0;
  width: 88%;
  background-color: var(--q-dark);
}
.row-item {
  align-items: center;
  gap: 1rem;
  margin: 1rem;
}
</style>
