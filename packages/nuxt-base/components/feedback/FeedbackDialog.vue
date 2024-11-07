<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import type { FetchError } from 'ofetch'
import type { Rect } from './FeedbackScreenshotEditor.vue'
import { parseAppList } from '~/utils/base'
import type { Feedback, FeedbackModel } from '~/types'
import { getBrowserInfo, getOSInfo } from '~/utils/userAgent'
import { useAppProps } from '~/composables/useAppProps'
import { convertElementToCanvas } from '~/utils/html2canvas'

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const q = useQuasar()
const appProps = useAppProps()
const { width, height } = useWindowSize()

const config = useRuntimeConfig()
const { fetch: kcFetch, tokenParsed } = useKeycloak()

const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const appList = parseAppList(config.public.appList).map(n => ({
  name: t(`base.apps.${n.name}`),
  value: n.name,
}))
const reportTypes = reactive([
  { name: t('feedback.reportType.bug'), value: 'bug' },
  { name: t('feedback.reportType.feedback'), value: 'feedback' },
  { name: t('feedback.reportType.suggestion'), value: 'suggestion' },
  { name: t('feedback.reportType.other'), value: 'other' },
])

const originalImage = ref('')
const rectArr = ref<Rect[]>([])

const feedbackModel: Feedback = reactive({
  appName: appProps.name,
  image: '',
  reportType: '',
  title: '',
  description: '',
  browser: {
    ...getBrowserInfo(navigator.userAgent),
    width: width.value,
    height: height.value,
  },
  os: getOSInfo(navigator.userAgent),
})
function isFormValid(): boolean {
  return feedbackModel.reportType !== ''
    && feedbackModel.title.trim() !== ''
    && feedbackModel.description.trim() !== ''
}

const dialogId = useId()
const editCanvas = ref(false)
const submitLoading = ref(false)
const ssLoading = ref(false)

async function sendFeedback() {
  // Remove Data URI prefix before sending the feedback
  const modifiedModel = {
    ...feedbackModel,
    image: feedbackModel.image?.split(',')[1],
    title: feedbackModel.title.trim(),
    description: feedbackModel.description.trim(),
  }
  submitLoading.value = true
  await kcFetch('/api/feedback', {
    method: 'POST',
    body: modifiedModel,
  }).then(() => q.notify({
    message: t('feedback.response.success'),
    color: 'green',
    position: 'top',
  })).catch((err: FetchError) => {
    if (err.data?.data?.code) {
      q.notify({
        message: t(`feedback.response.${err.data.data.code}`),
        color: 'red',
        position: 'top',
      })
    } else {
      q.notify({
        message: t(`feedback.response.error-fallback`),
        color: 'red',
        position: 'top',
      })
    }
  })
  submitLoading.value = false
}

async function takeScreenshot() {
  ssLoading.value = true
  // Wait for loading spinner to be rendered
  await sleep(500)
  try {
    const canvas = await convertElementToCanvas(document.body, {
      width: window.innerWidth,
      height: window.innerHeight,
      ignoreElements: el => el.id === dialogId,
    })

    feedbackModel.image = canvas.toDataURL()
    originalImage.value = canvas.toDataURL()
  } catch (error) {
    console.error(error)
    q.notify({
      message: t('feedback.response.screenshot-error'),
      color: 'red',
      position: 'top',
    })
  }
  ssLoading.value = false
}

function clearScreenshot() {
  feedbackModel.image = ''
  rectArr.value = []
}

function onSave(newImage: string, newRects: Rect[]) {
  feedbackModel.image = newImage
  rectArr.value = newRects
  editCanvas.value = false
}
</script>

<template>
  <QDialog
    :id="dialogId"
    ref="dialogRef"
    position="right"
    maximized
  >
    <div class="bg-white w-full h-full flex flex-col ">
      <span class="text-center p-3 font-extrabold text-xl">
        {{ t('feedback.dialogTitle') }}
      </span>
      <div class="bg-white w-full h-min p-3 grid grid-cols-2 gap-5">
        <FeedbackInput
          :text="tokenParsed?.name"
          readonly
          :label="t('feedback.username')"
        />
        <FeedbackInput
          :text="tokenParsed?.email"
          readonly
          :label="t('feedback.email')"
        />
        <QSelect
          v-model="feedbackModel.appName"
          :label="t('feedback.appName')"
          :options="appList"
          option-label="name"
          map-options
          emit-value
          outlined
          dense
          options-dense
        />
        <QSelect
          v-model="feedbackModel.reportType"
          :label="t('feedback.reportType._')"
          class="select-none"
          :options="reportTypes"
          option-label="name"
          map-options
          emit-value
          outlined
          dense
          options-dense
        />
      </div>
      <div class="p-3 space-y-3">
        <QInput
          v-model="feedbackModel.title"
          :label="t('feedback.title')"
          maxlength="30"
          outlined
          dense
        />
        <QInput
          v-model="feedbackModel.description"
          :label="t('feedback.description')"
          type="textarea"
          class="description-input"
          outlined
          autogrow
          maxlength="400"
        />
        <div class="border-1">
          <QImg
            :src="feedbackModel.image"
          >
            <div
              v-if="feedbackModel.image !== ''"
              class="absolute-center w-full text-center"
            >
              <QBtn
                flat
                dense
                no-caps
                padding="none"
                :label="t('feedback.screenshot.edit')"
                @click="editCanvas = !editCanvas"
              />
              <QBtn
                flat
                dense
                padding="none"
                icon="cancel"
                float="right"
                @click="clearScreenshot"
              />
            </div>
            <div
              v-if="feedbackModel.image === ''"
              class="absolute-bottom w-auto h-min text-center"
            >
              <QBtn
                flat
                dense
                padding="none"
                no-caps
                :loading="ssLoading"
                :label="t('feedback.screenshot.takeScreenshot')"
                @click="takeScreenshot"
              />
            </div>
          </QImg>
        </div>
      </div>
      <QSpace />
      <div class="flex gap-5 p-3">
        <QSpace />
        <QBtn
          no-caps
          color="primary"
          :label="t('feedback.submit')"
          icon="send"
          dense
          :loading="submitLoading"
          :disabled="!isFormValid()"
          @click="sendFeedback"
        >
          <template #loading>
            <QSpinnerFacebook />
          </template>
        </QBtn>
        <QBtn
          no-caps
          :label="t('feedback.cancel')"
          icon="cancel"
          dense
          @click="onDialogCancel"
        />
      </div>
    </div>
    <QDialog
      v-model="editCanvas"
      maximized
      to="body"
    >
      <div class="absolute top-1/2 left-1/2 z-10001 w-full h-full p-3">
        <FeedbackScreenshotEditor
          :image="originalImage"
          :rects="rectArr"
          @save="onSave"
          @close="editCanvas = false"
        />
      </div>
    </QDialog>
  </QDialog>
</template>

<style scoped lang="postcss">
.description-input :deep(.q-field__control) {
  min-height: 8rem;
  cursor: text;
}
.description-input :deep(.q-field__control-container) {
  @apply max-h-75 overflow-auto;
}
</style>
