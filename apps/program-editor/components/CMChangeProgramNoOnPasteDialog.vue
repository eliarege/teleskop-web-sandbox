<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { CopyItem } from '~/shared/types'

const props = defineProps<{
  remains: CopyItem
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const editor = useEditorStore()
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()
const newIds = ref(props.remains)

function getWarningStates(index: number) {
  const currentProgram = newIds.value.program[index]
  const willOverwrite = editor.allPrograms.find(program => program.programNo === currentProgram.newProgramNo)
  const hasDuplicate = currentProgram.newProgramNo !== null
    && newIds.value.program.filter(p => p.newProgramNo === currentProgram.newProgramNo).length > 1

  return { willOverwrite, hasDuplicate }
}

const isOKDisabled = computed(() => {
  return newIds.value.program.some((_, index) => {
    const { hasDuplicate } = getWarningStates(index)
    return newIds.value.program[index].newProgramNo === null || hasDuplicate
  })
})

function setAllToOriginal() {
  newIds.value.program.forEach((program, index) => {
    newIds.value.program[index].newProgramNo = program.programNo
  })
}

function clearAll() {
  newIds.value.program.forEach((_, index) => {
    newIds.value.program[index].newProgramNo = null
  })
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card style="width: 500px; max-height: 800px; display: flex; flex-direction: column;">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('contextMenu.changeProgramNoOnPasteDialog.title') }}
          <q-space />
          <q-btn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogHide()"
          >
            <q-tooltip>
              {{ t('close') }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.changeProgramNoOnPasteDialog.warning') }}</span>
      </q-card-section>

      <!-- Action Buttons -->
      <q-card-section class="q-py-sm">
        <div class="flex gap-2">
          <q-btn
            size="sm"
            color="primary"
            outline
            :label="t('contextMenu.changeProgramNoOnPasteDialog.setAllToOriginal')"
            @click="setAllToOriginal"
          >
            <q-tooltip>
              {{ t('contextMenu.changeProgramNoOnPasteDialog.setAllToOriginalTooltip') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            size="sm"
            color="negative"
            outline
            :label="t('contextMenu.changeProgramNoOnPasteDialog.clearAll')"
            @click="clearAll"
          >
            <q-tooltip>
              {{ t('contextMenu.changeProgramNoOnPasteDialog.clearAllTooltip') }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section class="flex-1 overflow-y-auto">
        <div
          v-for="(program, index) in props.remains.program"
          :key="index"
          class="mb-2"
        >
          <div class="flex items-center border-1 rounded p-2 m-1 border-gray-4 dark:border-gray-5">
            <InputNumber
              :id="`${index}`"
              :model-value="newIds.program[index].newProgramNo ?? undefined"
              hide-bottom-space
              maybe-empty
              class="w-15 text-xs"
              dense
              @update:model-value="val => newIds.program[index].newProgramNo = val ?? null"
            />

            <div>
              <UnoIcon
                class="i-jam:close-circle-f size-4 ml-2 cursor-pointer text-gray-5"
                @click="newIds.program[index].newProgramNo = null"
              />
              <q-tooltip>
                {{ t('contextMenu.changeProgramNoOnPasteDialog.clear') }}
              </q-tooltip>
            </div>

            <div>
              <UnoIcon
                class="i-jam:write-f size-4 ml-2 cursor-pointer text-gray-5"
                :class="{ 'text-blue': program.programNo === newIds.program[index].newProgramNo! }"
                @click="newIds.program[index].newProgramNo = program.programNo"
              />
              <q-tooltip>
                {{ t('contextMenu.changeProgramNoOnPasteDialog.overwrite') }}
              </q-tooltip>
            </div>

            <TruncatedText
              :text="`${program.programNo} - ${program.name}`"
              :max-length="36"
              class="ml-4 text-xs"
            />
          </div>

          <div class="text-red text-xs pl-2">
            <div
              v-if="getWarningStates(index).willOverwrite"
            >
              {{ t('contextMenu.changeProgramNoOnPasteDialog.willOverwrite') }}
            </div>

            <div
              v-if="getWarningStates(index).hasDuplicate"
            >
              {{ t('contextMenu.changeProgramNoOnPasteDialog.hasDuplicate') }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogHide()"
        />
        <q-btn
          :label="t('apply')"
          :disable="isOKDisabled"
          class="q-mr-sm bg-primary text-white"
          flat
          @click="onDialogOK(newIds)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
