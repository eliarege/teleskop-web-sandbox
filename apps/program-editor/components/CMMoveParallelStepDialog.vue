<script setup lang="ts">
import type { ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  commandNo: number
  commandName: string
  programCommand: ProgramStepCommand
  stepIndex: number
  stepsLength: number
}>()

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const commandNo = ref(props.commandNo)
const commandName = ref(props.commandName)
const startIndex = ref(props.stepIndex)
const endIndex = ref(props.stepsLength)

function checkTextOverflow() {
  if (commandName.value && commandName.value.length > 30) {
    commandName.value = `${commandName.value.substring(0, 27)}...`
  }
  return commandName.value
}
</script>

<template>
  <QDialog ref="dialogRef" class="select-none">
    <QCard class="w-600">
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('moveParallelStep.title') }}
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

      <QCardSection class="text-gray-8 dark:text-gray-3 items-center flex flex-row">
        <div class="flex flex-row gap-6 w-full">
          <div class="flex flex-col" style="min-width: 100px;">
            <label class="text-xs text-gray-7">{{ t('command.commandNo') }}</label>
            <span class="text-base text-sm">{{ commandNo }}</span>
          </div>

          <div class="flex flex-col" style="min-width: 0; flex-grow: 1;">
            <label class="text-xs text-gray-7">{{ t('command.name') }}</label>
            <QTooltip>
              {{ commandName }}
            </QTooltip>
            <span
              class="text-base text-sm"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
            >
              {{ checkTextOverflow() }}
            </span>
          </div>

          <QSelect
            v-model="startIndex"
            :options="Array.from({ length: stepsLength }, (_, i) => i + 1)"
            :label="t('moveParallelStep.startIndex')"
            class="col"
            dense
            :rules="[
              (val: string) => !!val || t('input.required', { field: t('moveParallelStep.startIndex') }),
              (val: number) => val <= endIndex || t('moveParallelStep.startIndexMore'),
            ]"
          />

          <QSelect
            v-model="endIndex"
            :options="Array.from({ length: stepsLength }, (_, i) => i + 1)"
            :label="t('moveParallelStep.endIndex')"
            class="col"
            dense
            :rules="[
              (val: string) => !!val || t('input.required', { field: t('moveParallelStep.endIndex') }),
              (val: number) => val >= startIndex || t('moveParallelStep.endIndexLess'),
            ]"
          />
        </div>
      </QCardSection>

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
          :label="t('apply')"
          class="q-mr-sm bg-primary text-white"
          flat
          :disable="startIndex > endIndex"
          @click="onDialogOK({ commandNo, startIndex, endIndex })"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
