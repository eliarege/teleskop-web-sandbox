<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import html2canvas from 'html2canvas-pro'
import type { Rect } from './TopbarFeedbackScreenshotEditor.vue'
import { parseAppList } from '~/utils/base'
import type { Feedback, FeedbackModel } from '~/types'
import { getBrowserInfo, getOSInfo } from '~/utils/userAgent'
import { useAppProps } from '~/composables/useAppProps'

const props = defineProps<{
  feedback: FeedbackModel
}>()
defineEmits([...useDialogPluginComponent.emits, 'update:modelValue'])

const { t } = useI18n()
const q = useQuasar()
const appProps = useAppProps()
const { width, height } = useWindowSize()

const config = useRuntimeConfig()
const { fetch: authFetch, tokenParsed } = useKeycloak()

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
  return feedbackModel.reportType.trim() !== ''
    && feedbackModel.description.trim() !== ''
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
    if (err.data?.code) {
      q.notify({
        message: t(`feedback.response.${err.data.code}`),
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

const ssLoading = ref(false)
async function takeScreenshot() {
  ssLoading.value = true
  const element = document.body
  // Wait for loading spinner to be rendered
  await sleep(500)
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
        <QSelect
          v-model="feedbackModel.appName"
          :label="t('feedback.app-name')"
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
      <div class="p-3">
        <div class="">
          <QInput
            v-model="feedbackModel.description"
            :label="t('feedback.description')"
            type="textarea"
            class="description-input"
            outlined
            autogrow
          />
        </div>
        <br>
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
                :label="t('feedback.screenshot.take-screenshot')"
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
          :submit-loading
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
        <TopbarFeedbackScreenshotEditor
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
