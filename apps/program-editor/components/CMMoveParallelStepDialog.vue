<script setup lang="ts">
import type { ParameterItem, ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  type: 'add' | 'remove' | 'changeParameter'
  commandNo: number
  commandName: string
  programCommand: ProgramStepCommand
  stepIndex: number
  stepsLength: number
  parameter?: { name: string, value: number | string }
}>()

const { t } = useI18n()
const editor = useEditorStore()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const commandNo = ref(props.commandNo)
const commandName = ref(props.commandName)
const startIndex = ref(props.stepIndex)
const endIndex = ref(props.stepsLength)

const commandIcon = computed(() => editor.getStepIcon(commandNo.value!))
</script>

<template>
  <QDialog ref="dialogRef" class="select-none">
    <QCard>
      <!-- Başlık -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t(`moveParallelStep.${props.type}.title`) }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <!-- İçerik -->
      <QCardSection class="text-gray-8 dark:text-gray-3">
        <div class="flex gap-5 no-wrap">
          <!-- Komut No -->
          <div class="flex flex-col w-40">
            <label class="text-xs text-gray-7 dark:text-gray-4">{{ t('command.commandNo') }}</label>
            <span class="text-sm text-gray-8 dark:text-gray-3">{{ commandNo }}</span>
          </div>

          <!-- Komut Adı -->
          <div class="flex flex-col w-60">
            <label class="text-xs text-gray-7 dark:text-gray-4">{{ t('command.name') }}</label>
            <QTooltip>{{ commandName }}</QTooltip>
            <span
              class="text-sm text-gray-8 dark:text-gray-3 w-full"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              :title="commandName"
            >
              <UnoIcon
                v-if="commandIcon"
                class="inline-block mr-1"
                :class="commandIcon?.name"
                :style="{ color: commandIcon?.color }"
              />
              {{ commandName }}
            </span>
          </div>

          <!-- Parametre Adı -->
          <div v-if="props.type === 'changeParameter'" class="flex flex-col w-40">
            <label class="text-xs text-gray-7 dark:text-gray-4">{{ t('moveParallelStep.changeParameter.parameter.name') }}</label>
            <span class="text-sm text-gray-8 dark:text-gray-3">{{ props.parameter.name }}</span>
          </div>

          <!-- Parametre Degeri -->
          <div v-if="props.type === 'changeParameter'" class="flex flex-col w-60">
            <label class="text-xs text-gray-7 dark:text-gray-4">{{ t('moveParallelStep.changeParameter.parameter.value') }}</label>
            <span class="text-sm text-gray-8 dark:text-gray-3">
              {{ props.parameter.value }}
            </span>
          </div>

          <!-- Başlangıç Index -->
          <div class="flex flex-col w-50">
            <QSelect
              v-model="startIndex"
              :options="Array.from({ length: stepsLength }, (_, i) => i + 1)"
              :label="t('moveParallelStep.startIndex')"
              class="col"
              dense
              options-dense
              popup-content-class="h-80"
              :rules="[
                (val: string) => !!val || t('input.required', { field: t('moveParallelStep.startIndex') }),
                (val: number) => val <= endIndex || t('moveParallelStep.startIndexMore'),
              ]"
            />
          </div>

          <!-- Bitiş Index -->
          <div class="flex flex-col w-50">
            <QSelect
              v-model="endIndex"
              :options="Array.from({ length: stepsLength }, (_, i) => i + 1)"
              :label="t('moveParallelStep.endIndex')"
              class="col"
              dense
              options-dense
              popup-content-class="h-80"
              :rules="[
                (val: string) => !!val || t('input.required', { field: t('moveParallelStep.endIndex') }),
                (val: number) => val >= startIndex || t('moveParallelStep.endIndexLess'),
              ]"
            />
          </div>
        </div>
      </QCardSection>

      <!-- Aksiyonlar -->
      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          class="q-mr-sm text-white"
          :label="t(`moveParallelStep.${props.type}.operate`)"
          :class="type === 'remove' ? 'bg-red-6' : 'bg-primary'"
          flat
          :disable="startIndex > endIndex"
          @click="onDialogOK({ type, commandNo, startIndex: startIndex - 1, endIndex: endIndex - 1 })"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
