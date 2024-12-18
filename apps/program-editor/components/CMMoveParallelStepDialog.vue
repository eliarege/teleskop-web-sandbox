<script setup lang="ts">
import type { ProgramStepCommand } from '~/shared/types'

const props = defineProps<{
  commandNo: number
  commandName: string
  programCommand: ProgramStepCommand
}>()

const commandNo = ref(props.commandNo)
const commandName = ref(props.commandName)
const startIndex = ref(0)
const endIndex = ref(0)

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
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
        <div>
          <span> {{ `${t('command.commandNo')} : ${commandNo}` }}</span>
          <span> {{ `${t('command.name')} : ${commandName}` }}</span>
          <QInput
            v-model="startIndex"
            :label="t('moveParallelStep.startIndex')"
          />
          <QInput
            v-model="endIndex"
            :label="t('moveParallelStep.endIndex')"
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
          @click="onDialogOK(commandNo)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
