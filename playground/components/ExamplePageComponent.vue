<script setup lang="ts">
interface Form {
  name: string
  email: string
  message: string
}
const formData = ref<Form>({
  name: '',
  email: '',
  message: '',
})
const $q = useQuasar()

const savingLocal = ref(false)
function onSaveError(error: unknown) {
  $q.notify({
    type: 'negative',
    message: `Failed to save changes: ${error instanceof Error ? error.message : String(error)}`,
    position: 'top',
  })
}

const { saving: savingGuard, markSaved } = useUnsavedChangesGuard({
  getState: () => formData.value,
  saveState: data => save(data),
  onSaveError,
  dialog: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. What would you like to do?',
  },
})

const saving = computed(() => savingLocal.value || savingGuard.value)

async function save(data: Form) {
  // Simulate async save operation
  await new Promise(resolve => setTimeout(resolve, 1000))
  // Simulate random save failure
  if (Math.random() < 0.5) {
    throw new Error('Random save error')
  } else {
    console.log('Saved data:', data)
    return true
  }
}

async function handleSave() {
  // Manual save trigger
  if (saving.value)
    return

  try {
    savingLocal.value = true
    await save(formData.value)
    markSaved()
  } catch (error) {
    onSaveError(error)
  } finally {
    savingLocal.value = false
  }
}
</script>

<template>
  <div class="q-pa-md">
    <q-card class="q-pa-md" style="max-width: 600px">
      <q-card-section>
        <div class="text-h5">
          Example Page Component
        </div>
        <div class="text-caption text-grey-7">
          Try editing the form and navigating away
        </div>
      </q-card-section>

      <q-card-section>
        <div class="q-gutter-md">
          <q-input
            v-model="formData.name"
            label="Name"
            outlined
            :disable="saving"
          />

          <q-input
            v-model="formData.email"
            label="Email"
            type="email"
            outlined
            :disable="saving"
          />

          <q-input
            v-model="formData.message"
            label="Message"
            type="textarea"
            outlined
            rows="4"
            :disable="saving"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-caption text-grey-7">
          Test navigation:
        </div>
        <div class="q-gutter-sm">
          <NuxtLink to="/" class="text-primary">
            Go to Home
          </NuxtLink>
          <span class="text-grey-5">|</span>
          <NuxtLink to="/another" class="text-primary">
            Go to Another Page
          </NuxtLink>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          label="Save"
          :loading="saving"
          :disable="saving"
          no-caps
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
