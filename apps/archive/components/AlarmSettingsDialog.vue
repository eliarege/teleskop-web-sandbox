<script setup lang="ts">
import { alarmTypes } from '~/shared/constants'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const settingStore = userSettingsStore()

const localAlarmSettings = ref<number[]>([...settingStore.alarmSettings])

const alarmOptions = computed(() =>
  alarmTypes.map(a => ({
    label: t(a.label),
    value: a.type,
  })),
)

const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => localAlarmSettings.value = alarmTypes.map(a => a.type),
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () => localAlarmSettings.value = [],

  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => localAlarmSettings.value.forEach((p) => {
      const index = localAlarmSettings.value.indexOf(p)
      if (index > -1)
        localAlarmSettings.value.splice(index, 1)
      else
        localAlarmSettings.value.push(p)
    }),
  },
]

function handleSave() {
  settingStore.updateAlarmSettings(localAlarmSettings.value)
  onDialogOK()
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-100" style="max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('alarmSettings.title') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section class="py-0">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">
          {{ t('alarmSettings.message') }}
        </div>
      </q-card-section>

      <q-card-section class="pr-10 py-0">
        <div class="flex justify-end mb-2">
          <q-btn
            v-for="(button, index) in buttons"
            :key="index"
            dense
            flat
            @click="button.onClick()"
          >
            <q-icon :name="button.icon" size="xs" />
            <q-tooltip> {{ button.tooltip }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="h-80 overflow-y-auto q-pa-sm">
          <q-option-group
            v-model="localAlarmSettings"
            :options="alarmOptions"
            type="checkbox"
            size="sm"
            dense
            class="q-gutter-y-sm"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('save')"
          class="bg-primary text-white"
          flat
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
