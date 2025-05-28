<script setup lang="ts">
import type { IOSetting } from '~/types/archive'

defineProps<{
  setting: IOSetting
  command: any
  typeKey?: string
}>()
const emit = defineEmits(['update:setting'])
const isDialogOpen = ref(false)
const settingsTab = ref('color')
const { t } = useI18n()
</script>

<template>
  <q-btn
    class="w-5 h-5"
    padding="none"
    :style="{ backgroundColor: setting.color }"
    @click="isDialogOpen = true"
  />

  <q-dialog v-model="isDialogOpen" persistent>
    <q-card style="min-width: 300px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6 text-center">
          {{ typeKey === 'calculatedValues'
            ? t(`calculatedValues.${command.name}`)
            : command.name }}
        </div>
      </q-card-section>

      <q-tabs
        v-model="settingsTab"
        dense
        align="justify"
      >
        <q-tab
          name="color"
          :label="t('settings.color')"
          no-caps
        />
        <q-tab
          name="line"
          :label="t('settings.line')"
          no-caps
        />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="settingsTab"
      >
        <q-tab-panel name="color">
          <q-color
            no-footer
            :model-value="setting.color"
            @change="emit('update:setting', { ...setting, color: $event })"
          />
        </q-tab-panel>

        <q-tab-panel name="line">
          <div class="flex gap5">
            <q-btn
              dense
              flat
              :class="setting.lineType === 'default' ? 'bg-blue-200' : ''"
              square
              @click="emit('update:setting', { ...setting, lineType: 'default' })"
            >
              <q-tooltip class="text-3.5">
                {{ t('settings.lineChart') }}
              </q-tooltip>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                width="24"
                viewBox="0 0 24 24"
                :fill="setting.color"
                :style="{ width: '5rem', height: '5rem' }"
              >
                <path
                  d="M3 17L10 10L14 14L21 7"
                  :stroke="setting.color"
                  stroke-width="2"
                  fill="none"
                />
              </svg>
            </q-btn>
            <q-btn
              flat
              dense
              :class="setting.lineType === 'dashed' ? 'bg-blue-200' : ''"
              square
              @click="emit('update:setting', { ...setting, lineType: 'dashed' })"
            >
              <q-tooltip class="text-3.5">
                {{ t('settings.dashedLineChart') }}
              </q-tooltip>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                :style="{ width: '5rem', height: '5rem' }"
                fill="none"
                stroke-width="2"
              >
                <polyline
                  points="3.5,18.5 10,12 14,16 22,8"
                  :stroke="setting.color"
                  stroke-dasharray="4,2"
                />
              </svg>
            </q-btn>
            <q-btn
              flat
              dense
              :class="setting.lineType === 'dotted' ? 'bg-blue-200' : ''"
              square
              @click="emit('update:setting', { ...setting, lineType: 'dotted' })"
            >
              <q-tooltip class="text-3.5">
                {{ t('settings.dottedLineChart') }}
              </q-tooltip>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                :stroke="setting.color"
                stroke-width="2"
                :style="{ width: '5rem', height: '5rem' }"
              >
                <!-- Lines connecting the dots -->
                <line
                  x1="4"
                  y1="16"
                  x2="9"
                  y2="11"
                />
                <line
                  x1="9"
                  y1="11"
                  x2="14"
                  y2="13"
                />
                <line
                  x1="14"
                  y1="13"
                  x2="20"
                  y2="6"
                />

                <!-- Data point circles -->
                <circle
                  cx="4"
                  cy="16"
                  r="1.5"
                  :fill="setting.color"
                />
                <circle
                  cx="9"
                  cy="11"
                  r="1.5"
                  :fill="setting.color"
                />
                <circle
                  cx="14"
                  cy="13"
                  r="1.5"
                  :fill="setting.color"
                />
                <circle
                  cx="20"
                  cy="6"
                  r="1.5"
                  :fill="setting.color"
                />
              </svg>
            </q-btn>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('close')"
          @click="isDialogOpen = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
