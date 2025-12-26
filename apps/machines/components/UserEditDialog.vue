<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface UserForm {
  userId?: number
  userName: string
  userSurname: string
  userPass: string
  userMode: string
  userInfo: string
  userActive: boolean
  userDeleted?: boolean
  userMode2?: string
  userType: number
}

const props = defineProps<{
  user?: UserForm
  existingUserIds: number[]
  userTypeOptions: { label: string, value: number }[]
}>()

const emit = defineEmits<{
  (e: 'saved', user: UserForm): void
  (e: 'editPermissions', userId: number | undefined): void
}>()

const { t } = useI18n()
const { fetch } = useKeycloak()
const { notifyError } = useNotify()

const isEdit = computed(() => !!props.user)
const visible = defineModel<boolean>()

function createEmptyForm(): UserForm {
  return {
    userId: undefined,
    userName: '',
    userSurname: '',
    userPass: '',
    userMode: '0x00000000',
    userInfo: '',
    userActive: true,
    userDeleted: false,
    userMode2: '0x00000000',
    userType: 1,
  }
}

const form = ref<UserForm>(createEmptyForm())

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
  resetToBaseline,
} = useUnsavedDialogGuard({
  getState: () => form.value,
  setState: (state) => {
    form.value = { ...createEmptyForm(), ...(state ?? {}) }
  },
  isOpen: () => !!visible.value,
})

watch(
  () => visible.value,
  (val) => {
    if (val) {
      if (isEdit.value && props.user) {
        form.value = {
          userId: props.user.userId,
          userName: props.user.userName,
          userSurname: props.user.userSurname,
          userPass: props.user.userPass,
          userMode: props.user.userMode,
          userInfo: props.user.userInfo,
          userActive: props.user.userActive,
          userDeleted: props.user.userDeleted,
          userMode2: props.user.userMode2,
          userType: props.user.userType,
        }
        markSaved()
      } else {
        form.value = createEmptyForm()
        markSaved()
      }
    }
  },
)

const formRef = ref()

async function saveUser() {
  if (formRef.value && !(await formRef.value.validate?.()))
    return

  try {
    if (isEdit.value) {
      await fetch(`/api/user-definitions/${props.user!.userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form.value,
        }),
      })
    } else {
      await fetch(`/api/user-definitions`, {
        method: 'POST',
        body: JSON.stringify({
          ...form.value,
        }),
      })
    }

    emit('saved', { ...form.value, userId: props.user?.userId })
    visible.value = false
  } catch (err: any) {
    if (err?.statusCode === 400) {
      console.error('Bu ID zaten mevcut:', err.statusMessage)
      notifyError(t('userIdAlreadyExists'))
    } else {
      console.error('Kullanıcı kaydedilirken hata:', err)
      notifyError(t('errorSavingUser'))
    }
  }
}

function uniqueUserId(val: number | string) {
  const currentUserId = props.user?.userId
  return Number(val) === currentUserId || !props.existingUserIds.includes(Number(val))
}

function handleCancel() {
  requestClose(() => {
    visible.value = false
  })
}
</script>

<template>
  <q-dialog v-model="visible" :persistent="hasChanges">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6 flex items-center">
          {{ isEdit ? t('editUser') : t('addUser') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="handleCancel"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <q-form
          ref="formRef"
          class="grid grid-cols-3 gap-4"
          @submit.prevent="saveUser"
        >
          <q-input
            v-model.number="form.userId"
            :label="t('userId')"
            type="number"
            :rules="[
              val => !!val || t('userIdRequired'),
              val => val > 0 || t('userIdMustBePositive'),
              val => uniqueUserId(val) || t('userIdAlreadyExists'),
            ]"
            autofocus
            outlined
            dense
          />
          <q-input
            v-model="form.userName"
            :label="t('userName')"
            :rules="[val => !!val || t('userNameRequired')]"
            autofocus
            outlined
            dense
          />
          <q-input
            v-model="form.userSurname"
            :label="t('userSurname')"
            :rules="[val => !!val || t('userSurnameRequired')]"
            outlined
            dense
          />
          <q-input
            v-model="form.userPass"
            :label="t('userPassword')"
            :rules="[
              val => isEdit || !!val || t('userPasswordRequired'),
              val => val.length >= 4 || t('userPasswordMinLength', { length: 4 }),
              val => val.length <= 9 || t('userPasswordMaxLength', { length: 9 }),
            ]"
            outlined
            dense
          />
          <q-select
            v-model="form.userType"
            :options="userTypeOptions"
            :label="t('userType')"
            map-options
            emit-value
            options-dense
            dense
            outlined
          />
          <q-toggle
            v-model="form.userActive"
            :label="t('active')"
            dense
          />
          <q-input
            v-model="form.userInfo"
            :label="t('userInfo')"
            type="textarea"
            outlined
            class="col-span-3"
          />

          <!-- Permissions Button (only for edit) -->
          <q-btn
            v-if="isEdit"
            :label="t('permissions')"
            color="primary"
            outline
            no-caps
            class="col-span-1"
            @click="emit('editPermissions', form.userId)"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="handleCancel"
        />
        <q-btn
          :label="t('save')"
          class="q-mr-sm bg-primary text-white"
          color="primary"
          flat
          @click="saveUser"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <ConfirmDialog
    v-model="confirmVisible"
    :title="t('unsavedChanges.title')"
    :message="t('unsavedChanges.message')"
    :cancel-label="t('unsavedChanges.continue')"
    :confirm-label="t('unsavedChanges.discard')"
    confirm-color="negative"
    @confirm="confirmDiscard"
    @cancel="keepEditing"
  />
</template>
