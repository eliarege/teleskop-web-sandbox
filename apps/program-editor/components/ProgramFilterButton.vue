<script setup lang="ts">
import type { ProgramFilter } from '~/shared/types';

const { t } = useI18n()
const editor = useEditorStore()
const filter = useFilterStore()
const numberInput = ref()

const programFilter = ref<ProgramFilter>({
  programNo: filter.existingFilter.programNo,
  programName: filter.existingFilter.programName,
  processType: filter.existingFilter.processType,
  clearOnChange: filter.existingFilter.clearOnChange,
})

async function applyFilter() {
  filter.existingFilter = programFilter.value
  editor.isLoading = true
  await editor.fetchAllPrograms(programFilter.value)
  editor.isLoading = false
  filter.showFilterPopup = false
}

async function deleteFilter() {
  clearFilter()
  programFilter.value = {
    clearOnChange: true,
  }
  editor.isLoading = true
  await editor.fetchAllPrograms()
  editor.isLoading = false
  filter.showFilterPopup = false
}

function getFilterIconColor() {
  return filter.existingFilter.programNo
      || filter.existingFilter.programName
      || filter.existingFilter.processType
      ? 'red-6' : 'gray-6'
}

function focusNumberInput() {
  nextTick(() => {
    numberInput.value?.$el.querySelector('input').focus()
  })
}
</script>

<template>
  <div>
    <TopbarButton
      icon="filter_alt"
      :color="getFilterIconColor()"
      rounded
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
      @show="focusNumberInput()"
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
          <QForm @submit="applyFilter" @reset="clearFilter">
            <InputNumber
              ref="numberInput"
              v-model="programFilter.programNo"
              :label="t('filter.programNo')"
              maybe-empty
              dense
            />
            <QInput
              v-model="programFilter.programName"
              dense
              :label="t('filter.programName')"
            />
            <QSelect
              v-model="programFilter.processType"
              class="q-mt-md"
              dense
              options-dense
              :options="editor.allProcessType"
              :label="t('filter.processType')"
            />
            <QCheckbox
              v-model="programFilter.clearOnChange"
              class="q-mt-md text-gray-8"
              color="gray-8"
              :label="t('filter.clearFilterOnChange')"
              dense
            />
            <div class="flex justify-end">
              <q-btn
              type="submit"
                v-close-popup
                outline
                :label="t('filter.apply')"
                icon="check"
                @click="applyFilter()"
              />
            </div>
          </QForm>
        </div>
      </div>
    </QPopupProxy>
  </div>
</template>
