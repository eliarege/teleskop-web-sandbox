<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import type { Feedback } from '~/types'
import { getBrowserInfo, getOSInfo } from '~/utils/userAgent'

interface FeedbackModel {
  username: string
  email: string
  app: {
    name: string
  }
  reportType: string
  description: string
  image: string
}

const props = defineProps<{ feedback: FeedbackModel }>()
defineEmits([...useDialogPluginComponent.emits, 'update:modelValue'])

const { t } = useI18n()
const q = useQuasar()
const { width, height } = useWindowSize()

const config = useRuntimeConfig()
const kc = useKeycloak()

const { dialogRef, onDialogOK } = useDialogPluginComponent()

const username = ref(`${kc.userProfile.value.firstName}` + ' ' + `${kc.userProfile.value.lastName}`)
const email = ref(kc.userProfile.value.email)

const reportType = reactive([
  {
    name: t('feedback.reportType.bug'),
  },
  {
    name: t('feedback.reportType.feedback'),
  },
  {
    name: t('feedback.reportType.suggestion'),
  },
  {
    name: t('feedback.reportType.other'),
  },
])

const descriptionRef = ref()
const feedbackModel: Feedback = reactive({
  feedbackDate: new Date(),
  username: username.value,
  email: email.value,
  app: {
    name: props.feedback.app.name,
  },
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
    feedbackModel.app.name !== null && feedbackModel.app.name.trim() !== ''
    && feedbackModel.reportType !== null && feedbackModel.reportType.trim() !== ''
    && feedbackModel.description !== null && feedbackModel.description.trim() !== ''
  )
}

function onAppItemSelect(item: string) {
  feedbackModel.app.name = item
}

function onReportItemSelect(item: string) {
  feedbackModel.reportType = item
}

const editCanvas = ref(false)
const loading = ref(false)
async function sendFeedback() {
  const modifiedModel = {
    ...feedbackModel,
    image: feedbackModel.image?.split(',')[1],
  }
  loading.value = true
  await $fetch('/api/feedback', {
    method: 'POST',
    body: modifiedModel,
  }).then(() => q.notify({
    message: t('feedback.sent-succesfull'),
    color: 'green',
    position: 'top',
  })).catch((err) => {
    q.notify({
      message: t(`feedback.${err.statusMessage}`),
      color: 'red',
      position: 'top',
    })
  })
  loading.value = false
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
          v-model:text="username"
          readonly
          :label="t('feedback.username')"
        />
        <TopbarFeedbackInput
          v-model:text="email"
          readonly
          :label="t('feedback.email')"
        />

        <TopbarFeedbackInput
          v-model:text="feedbackModel.app.name"
          :label="t('feedback.app-name')"
          class="select-none"
          readonly
        >
          <TopbarFeedbackInputDropdown :items="config.public.appList" @dropdown-click="onAppItemSelect" />
        </TopbarFeedbackInput>
        <TopbarFeedbackInput
          v-model:text="feedbackModel.reportType"
          :label="t('feedback.reportType.-')"
          class="select-none"
          readonly
        >
          <TopbarFeedbackInputDropdown :items="reportType" @dropdown-click="onReportItemSelect" />
        </TopbarFeedbackInput>
      </div>
      <div class="p-3">
        <q-input
          v-model="feedbackModel.description"
          :label="t('feedback.description')"
          type="textarea"
          class="border-1 rounded p-3 max-h-250px overflow-auto"
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
                :label="t('feedback.screenshot.take-screenshot')"
                @click="onDialogOK(feedbackModel)"
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
          :loading
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
      <TopbarFeedbackEditor v-model:image="feedbackModel.image" @close="editCanvas = !editCanvas" />
    </div>
  </QDialog>
</template>

<style scoped lang="postcss">
</style>
