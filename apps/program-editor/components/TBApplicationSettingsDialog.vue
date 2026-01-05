<script setup lang="ts">
import { commandTypeMaps } from '~/shared/constants'

const props = defineProps<{
  selectedIcons: number
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()

const selectedIcons = ref(props.selectedIcons)
const fullSelect = Number.parseInt('1'.repeat(commandTypeMaps.length), 2)
const selectAll = ref(selectedIcons.value === fullSelect)

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  selectedIcons.value = selectAll.value ? fullSelect : 0
}

function toggleReverseSelection() {
  selectedIcons.value = selectedIcons.value ^ fullSelect
  selectAll.value = selectedIcons.value === fullSelect
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('iconSettingsDialog.title') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="text-h8 w-100 mb-2 color-gray-6 dark:text-gray-4">
          {{ t('iconSettingsDialog.selectIcons') }}
        </div>
        <div class="h-110 overflow-auto border-1 rounded pl-3 dark:border-dark-3 p-3">
          <div
            v-for="commandType in commandTypeMaps"
            :key="commandType.index"
            class="flex items-center mb-2"
          >
            <ChemIconCheckbox
              v-model="selectedIcons"
              :command-index="commandType.index"
              :label="t(`commandType.${commandType.title}`)"
              class="mr-2"
              dense
            />
            <UnoIcon
              :key="commandType.icon"
              :class="commandType.icon"
              :style="{ color: commandType.color, fontSize: '1rem' }"
            />
          </div>
        </div>
        <div class="flex gap-4 justify-start p-2">
          <q-btn
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="selectAll ? t('dropAll') : t('selectAll')"
            dense
            flat
            @click="toggleSelectAll"
          />
          <q-btn
            class="w-40 bg-gray-1 dark:bg-dark-4"
            :label="t('selectReverse')"
            dense
            flat
            @click="toggleReverseSelection"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('apply')"
          class="bg-primary text-white"
          flat
          @click="onDialogOK(selectedIcons)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
