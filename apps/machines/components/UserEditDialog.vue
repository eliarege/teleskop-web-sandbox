<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface User {
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
  user?: User
  existingUserIds: number[]
  userTypeOptions: { label: string, value: number }[]
}>()

const emit = defineEmits<{
  (e: 'saved', user: User): void
  (e: 'editPermissions', userId: number | undefined): void
}>()

const { t } = useI18n()
const { fetch } = useKeycloak()
const { notifyError } = useNotify()

const isEdit = computed(() => !!props.user)
const visible = defineModel<boolean>()

const form = ref<User>({
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
      } else {
        form.value = {
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
      await fetch(`/api/user-definitions/route`, {
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
</script>

<template>
  <q-dialog v-model="visible" persistent>
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
            @click="visible = false"
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
            v-model="form.userId"
            :label="t('userId')"
            type="number"
            :rules="[val => !!val || t('userIdRequired'),
                     val => val > 0 || t('userIdMustBePositive'),
                     val => uniqueUserId(val) || t('userIdAlreadyExists'),
            ]"
            dense
            autofocus
            outlined
          />
          <q-input
            v-model="form.userName"
            :label="t('userName')"
            :rules="[val => !!val || t('userNameRequired')]"
            dense
            outlined
            autofocus
          />
          <q-input
            v-model="form.userSurname"
            :label="t('userSurname')"
            :rules="[val => !!val || t('userSurnameRequired')]"
            dense
            outlined
          />
          <q-input
            v-model="form.userPass"
            :label="t('userPassword')"
            :rules="[val => isEdit || !!val || t('userPasswordRequired')]"
            dense
            outlined
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
          v-close-popup
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          flat
          @click="visible = false"
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
</template>
