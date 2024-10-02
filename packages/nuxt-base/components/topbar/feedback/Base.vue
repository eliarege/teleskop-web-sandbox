<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import html2canvas from 'html2canvas-pro'
import { parseAppList } from '~/utils/base'
import type { Feedback, FeedbackModel } from '~/types'
import { getBrowserInfo, getOSInfo } from '~/utils/userAgent'

const props = defineProps<{ feedback: FeedbackModel }>()
defineEmits([...useDialogPluginComponent.emits, 'update:modelValue'])

const { t } = useI18n()
const q = useQuasar()
const { width, height } = useWindowSize()

const config = useRuntimeConfig()
const { fetch: authFetch, tokenParsed } = useKeycloak()

const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const appList = parseAppList(config.public.appList)

const reportTypes = reactive([
  { name: t('feedback.reportType.bug') },
  { name: t('feedback.reportType.feedback') },
  { name: t('feedback.reportType.suggestion') },
  { name: t('feedback.reportType.other') },
])

const originalImage = ref('')
const rectArr = ref([])

const feedbackModel: Feedback = reactive({
  appName: props.feedback.appName,
  image: props.feedback.image,
  reportType: props.feedback.reportType,
  description: props.feedback.description,
  browser: {
    ...getBrowserInfo(navigator.userAgent),
    width: width.value,
    height: height.value,
  },
  os: getOSInfo(navigator.userAgent),
})

function isFormValid(): boolean {
  return (
    feedbackModel.appName !== null && feedbackModel.appName.trim() !== ''
    && feedbackModel.reportType !== null && feedbackModel.reportType.trim() !== ''
    && feedbackModel.description !== null && feedbackModel.description.trim() !== ''
  )
}

function onAppItemSelect(item: string) {
  feedbackModel.appName = item
}

function onReportItemSelect(item: string) {
  feedbackModel.reportType = item
}

const editCanvas = ref(false)
const submitLoading = ref(false)
async function sendFeedback() {
  // Remove Data URI prefix before sending the feedback
  const modifiedModel = {
    ...feedbackModel,
    image: feedbackModel.image?.split(',')[1],
  }
  submitLoading.value = true
  await authFetch('/api/feedback', {
    method: 'POST',
    body: modifiedModel,
  }).then(() => q.notify({
    message: t('feedback.response.success'),
    color: 'green',
    position: 'top',
  })).catch((err) => {
    q.notify({
      message: t(`feedback.response.${err.statusMessage}`),
      color: 'red',
      position: 'top',
    })
  })
  submitLoading.value = false
}

const ssLoading = ref(false)
async function takeScreenshot() {
  ssLoading.value = true
  const element = document.body
  try {
    const canvas = await html2canvas(element, {
      logging: false,
      useCORS: true,
      scale: window.devicePixelRatio,
      ignoreElements: element => element.getAttribute('role') === 'dialog',
    })

    feedbackModel.image = canvas.toDataURL()
    originalImage.value = canvas.toDataURL()
  } catch (error) {
    console.error('Ekran görüntüsü alınırken hata oluştu:', error)
  }
  ssLoading.value = false
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    position="right"
    maximized
  >
    <div class="bg-white w-full h-full flex flex-col ">
      <span class="text-center p-3 font-extrabold text-xl">{{ t('feedback.title') }}</span>
      <div class="bg-white w-full h-min p-3 grid grid-cols-2 gap-5">
        <TopbarFeedbackInput
          :text="tokenParsed?.name"
          readonly
          :label="t('feedback.username')"
        />
        <TopbarFeedbackInput
          :text="tokenParsed?.email"
          readonly
          :label="t('feedback.email')"
        />
        <TopbarFeedbackInput
          v-model:text="feedbackModel.appName"
          :label="t('feedback.app-name')"
          class="select-none"
          readonly
        >
          <TopbarFeedbackInputDropdown :items="appList" @dropdown-click="onAppItemSelect" />
        </TopbarFeedbackInput>
        <TopbarFeedbackInput
          v-model:text="feedbackModel.reportType"
          :label="t('feedback.reportType.-')"
          class="select-none"
          readonly
        >
          <TopbarFeedbackInputDropdown :items="reportTypes" @dropdown-click="onReportItemSelect" />
        </TopbarFeedbackInput>
      </div>
      <div class="p-3">
        <q-input
          v-model="feedbackModel.description"
          :label="t('feedback.description')"
          type="textarea"
          class="description-input"
          outlined
          autogrow
        />
        <br>
        <div class="border-1">
          <q-img
            :src="feedbackModel.image"
          >
            <div
              v-if="feedbackModel.image !== ''"
              class="absolute-center w-full text-center"
            >
              <q-btn
                flat
                dense
                no-caps
                padding="none"
                :label="t('feedback.screenshot.edit')"
                @click="editCanvas = !editCanvas"
              />
              <q-btn
                flat
                dense
                padding="none"
                icon="cancel"
                float="right"
                @click="feedbackModel.image = ''"
              />
            </div>
            <div
              v-if="feedbackModel.image === ''"
              class="absolute-bottom w-auto h-min text-center"
            >
              <q-btn
                flat
                dense
                padding="none"
                no-caps
                :loading="ssLoading"
                :label="t('feedback.screenshot.take-screenshot')"
                @click="takeScreenshot"
              />
            </div>
          </q-img>
        </div>
      </div>
      <q-space />
      <div class="flex gap-5 p-3">
        <q-space />
        <q-btn
          no-caps
          color="primary"
          :label="t('feedback.submit')"
          icon="send"
          dense
          :submit-loading
          :disabled="!isFormValid()"
          @click="sendFeedback"
        >
          <template #loading>
            <q-spinner-facebook />
          </template>
        </q-btn>
        <q-btn
          no-caps
          :label="t('feedback.cancel')"
          icon="cancel"
          dense
          @click="onDialogCancel"
        />
      </div>
    </div>
  </QDialog>

  <QDialog
    v-model="editCanvas"
    maximized
    to="body"
  >
    <div class="absolute top-1/2 left-1/2 z-10001 w-full h-full p-3">
      <TopbarFeedbackEditor
        v-model:image="originalImage"
        v-model:rect-arr="rectArr"
        v-model:merged-image="feedbackModel.image"
        @close="editCanvas = !editCanvas"
      />
    </div>
  </QDialog>
</template>

<style scoped lang="postcss">
.description-input :deep(.q-field__control) {
  min-height: 8rem;
}
</style>
