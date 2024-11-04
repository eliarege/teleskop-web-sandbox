<script setup lang="ts">
import type { Filter } from '~/shared/types';

const { t } = useI18n()
const editor = useEditorStore()
const filter = useFilterStore()

const programFilter = ref<Filter>({
  programNo: filter.existingFilter.programNo,
  programName: filter.existingFilter.programName,
  processType: filter.existingFilter.processType,
  clearOnChange: filter.existingFilter.clearOnChange,
})

async function applyFilter() {
  filter.existingFilter = programFilter.value
  filter.showFilterPopup = false
  editor.isLoading = true
  await editor.fetchAllPrograms(programFilter.value)
  editor.isLoading = false
}

async function deleteFilter() {
  clearFilter()
  programFilter.value = {
    programNo: null,
    programName: null,
    processType: null,
    clearOnChange: true,
  }
  filter.showFilterPopup = false
  editor.isLoading = true
  await editor.fetchAllPrograms()
  editor.isLoading = false
}
</script>

<template>
  <TopbarButton
    icon="filter_alt"
    :color="programFilter.programNo || programFilter.programName || programFilter.processType ? 'red' : 'gray-8' "
    round
  >
    <QTooltip class="text-capitalize">
      {{ t('filter.programFilter') }}
    </QTooltip>
  </TopbarButton>

  <QPopupProxy
    v-model="filter.showFilterPopup"
    transition-show="scale"
    transition-hide="scale"
    anchor="bottom right"
    self="top right"
    class="rounded-md"
  >
    <div class="q-pa-sm" style="width: 370px;">
      <div class="text-4 flex items-center">
        <span class="pl-2">{{ t('filter.programFilter') }}</span>
        <QSpace />
        <QBtn
          icon="delete"
          class="text-gray-6 mr-2"
          flat
          round
          size="md"
          dense
          @click="deleteFilter()"
        >
          <QTooltip> {{ t('filter.delete_all') }} </QTooltip>
        </QBtn>
        <QBtn
          icon="close"
          class="text-gray-8"
          flat
          round
          size="md"
          dense
          @click="filter.showFilterPopup = false"
        >
          <QTooltip>{{ t('filter.close') }}</QTooltip>
        </QBtn>
      </div>
      <QSeparator />
      <div class="q-pa-md justify-center">
          <QInput
            v-model="programFilter.programNo"
            :label="t('filter.programNo')"
            class="q-mb-md"
            type="number"
            min="0"
            max="10000"
            dense
            @keyup.enter="applyFilter"
          />
          <QInput
            v-model="programFilter.programName"
            dense
            :label="t('filter.programName')"
            @keyup.enter="applyFilter"
          />
          <QSelect
            v-model="programFilter.processType"
            class="q-mt-md"
            dense
            options-dense
            :options="editor.allProcessType"
            :label="t('filter.processType')"
            @keyup.enter="applyFilter"
          />
          <QCheckbox
            v-model="programFilter.clearOnChange"
            class="q-mt-md"
            color="black"
            :label="t('filter.clearFilterOnChange')"
          />
        </div>
        <div class="flex justify-end">
          <q-btn
            v-close-popup
            outline
            :label="t('filter.apply')"
            icon="check"
            @click="applyFilter()"
          />
        </div>
    </div>
  </QPopupProxy>
</template>
