<script setup lang="ts">
import type { DatabaseConnection } from '~/shared/types'
import { connectTeleskopDB } from '~/server/connectionPool'

const { t } = useI18n()
const q = useQuasar()
const { data: defaultSettings } = await useFetch<DatabaseConnection>('/api/teleskop/parameters')
const teleskopSettings = ref<DatabaseConnection>()
teleskopSettings.value = { ...defaultSettings.value }

const passwordVisible = ref(false)

async function onSave() {
  try {
    const connection = teleskopSettings.value
    await $fetch(`/api/teleskop/parameters`, { method: 'PUT', body: connection })
    connectTeleskopDB(connection)
    q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'done',
      message: t('Success'),
      timeout: 3000,
    })
  } catch (e) {
    q.notify({
      color: 'red-4',
      textColor: 'white',
      icon: 'cancel',
      message: t('Failed'),
      timeout: 3000,
    })
  }
}

function onReset() {
  teleskopSettings.value = { ...defaultSettings.value }
}
</script>

<template>
  <QForm @submit.prevent>
    <div class="flex flex-row align-start justify-center">
      <div class="text-xl">
        {{ t('settings.Teleskop') }}
      </div>
      <div class="flex-center flex-col gap-5 text-size-4 mt-10 w-full ">
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
      <div class="flex-center justify-evenly p-10">
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
  </QForm>
</template>

<style scoped>
.row-item {
  align-items: center;
  gap: 1rem;
  margin: 1rem;
}
</style>
