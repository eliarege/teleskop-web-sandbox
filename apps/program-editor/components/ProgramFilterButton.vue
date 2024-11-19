<script setup lang="ts">
const { t } = useI18n()
const editor = useEditorStore()
const filter = useProgramFilterStore()
const inputId = useId()

async function applyFilter() {
  editor.isLoading = true
  await editor.fetchAllPrograms()
  editor.isLoading = false
  filter.showFilterPopup = false
}

async function deleteFilter() {
  filter.clearFilter()
  editor.isLoading = true
  await editor.fetchAllPrograms()
  editor.isLoading = false
  filter.showFilterPopup = false
}

function focusNumberInput() {
  document.getElementById(inputId)?.focus()
}

function togglePopup() {
  filter.showFilterPopup = !filter.showFilterPopup
}
</script>

<template>
  <div>
    <TopbarButton
      :color="filter.hasFilter() ? 'red-6' : 'gray-6'"
      icon="filter_alt"
      rounded
      @click="togglePopup"
    >
      <QTooltip class="text-capitalize">
        {{ t('filter.programFilter') }}
      </QTooltip>

      <QPopupProxy
        v-model="filter.showFilterPopup"
        transition-show="scale"
        transition-hide="scale"
        anchor="bottom right"
        self="top right"
        class="rounded-md"
        no-parent-event
        @show="focusNumberInput"
      >
        <div class="q-pa-sm" style="width: 380px;">
          <div class="text-4 flex items-center">
            <span class="text-gray-8 ml-2">{{ t('filter.programFilter') }}</span>
            <QSpace />
            <QBtn
              class="text-gray-6 mr-2"
              icon="delete"
              size="md"
              round
              dense
              flat
              @click="deleteFilter"
            >
              <QTooltip> {{ t('filter.delete_all') }} </QTooltip>
            </QBtn>
            <QBtn
              class="text-gray-8"
              icon="close"
              size="md"
              round
              dense
              flat
              @click="filter.showFilterPopup = false"
            >
              <QTooltip>{{ t('filter.close') }}</QTooltip>
            </QBtn>
          </div>
          <QSeparator />

          <div class="q-pa-md justify-center">
            <QForm class="q-gutter-md" @submit.prevent="applyFilter">
              <InputNumber
                :id="inputId"
                v-model="filter.existingFilter.programNo"
                :label="t('filter.programNo')"
                hide-bottom-space
                maybe-empty
                dense
              />
              <QInput
                v-model="filter.existingFilter.programName"
                :label="t('filter.programName')"
                dense
              />
              <QSelect
                v-model="filter.existingFilter.processType"
                :options="editor.allProcessType"
                :label="t('filter.processType')"
                options-dense
                dense
              />
              <QCheckbox
                v-model="filter.existingFilter.clearOnChange"
                :label="t('filter.clearFilterOnChange')"
                color="gray-8"
                dense
              />
              <div class="flex justify-end">
                <QBtn
                  class="bg-primary text-white"
                  :label="t('filter.apply')"
                  type="submit"
                  icon="check"
                  flat
                />
              </div>
            </QForm>
          </div>
        </div>
      </QPopupProxy>
    </TopbarButton>
  </div>
</template>
