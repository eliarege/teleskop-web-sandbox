<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { ProgramDeletionSource } from '~/shared/types'

const props = defineProps<{
  programNos: number[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const selectedOption = ref<ProgramDeletionSource>('both')

const options: { label: string, value: ProgramDeletionSource }[] = [
  { label: t('contextMenu.deleteProgramDialog.deleteFromBoth'), value: 'both' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromTeleskop'), value: 'db' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromMachine'), value: 'machine' },
]
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard style="width: 500px" class="select-none">
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('contextMenu.deleteProgramDialog.title') }}
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

      <QCardSection class="text-gray-8 dark:text-gray-3 pt-0">
        <div v-if="programNos.length === 1">
          {{ t('contextMenu.deleteProgramDialog.message', { count: 1, programNo: props.programNos[0] }) }}
        </div>

        <div v-else>
          <div
            class="row q-gutter-xs scroll q-pa-sm bg-gray-1 dark:bg-dark-3 rounded-borders mb-3"
            style="max-height: 120px;"
          >
            <q-chip
              v-for="no in programNos"
              :key="no"
              outline
              dense
              size="12px"
              color="primary"
              class="text-gray-8 dark:text-gray-3"
            >
              {{ no }}
            </q-chip>
          </div>
          <div>
            {{ t('contextMenu.deleteProgramDialog.message', { count: programNos.length }) }}
          </div>
        </div>

        <div class="mt-4 flex q-pa-sm">
          <QOptionGroup
            v-model="selectedOption"
            class="q-gutter-sm"
            :options="options"
            dense
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
          :label="t('delete')"
          class="q-mr-sm bg-red-6 text-white"
          flat
          @click="onDialogOK(selectedOption)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
