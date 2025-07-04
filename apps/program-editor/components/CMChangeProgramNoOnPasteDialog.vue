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
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const newIds = ref(props.remains)

const isOKDisabled = computed(() => {
  return newIds.value.program.some(program => program.newProgramNo === null)
})

function formatProgramName(name: string) {
  return name.length > 30 ? `${name.substring(0, 30)}...` : name
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card style="width: 500px" class="select-none">
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
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.changeProgramNoOnPasteDialog.warning') }}</span>
      </q-card-section>

      <q-card-section>
        <div
          v-for="(program, index) in props.remains.program"
          :key="index"
          class="p-2 border-1 rounded m-2 items-center border-gray-4 dark:border-gray-5"
        >
          <div class="flex items-center ">
            <InputNumber
              :id="`${index}`"
              :model-value="newIds.program[index].newProgramNo ?? undefined"
              class="w-20"
              label=""
              hide-bottom-space
              maybe-empty
              dense
              @update:model-value="val => newIds.program[index].newProgramNo = val ?? null"
            />
            <UnoIcon
              class="i-jam:write-f size-4 ml-2 cursor-pointer"
              :class="{ 'text-blue': program.programNo === newIds.program[index].newProgramNo! }"
              @click="newIds.program[index].newProgramNo = program.programNo"
            >
              <q-tooltip>
                {{ t('contextMenu.changeProgramNoOnPasteDialog.overwrite') }}
              </q-tooltip>
            </UnoIcon>

            <span class="ml-2">
              <div>
                {{ program.programNo }} - {{ formatProgramName(program.name) }}
                <q-tooltip v-if="program.name.length > 30">
                  {{ program.name }}
                </q-tooltip>
              </div>
            </span>
          </div>

          <div>
            <span
              v-if="editor.allPrograms.find(program => program.programNo === newIds.program[index].newProgramNo)"
              class="text-bold text-red text-3"
            >
              {{ t('contextMenu.changeProgramNoOnPasteDialog.copyWillOverwriteProgram') }}
            </span>
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
          @click="onDialogCancel"
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
