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
  modelValue: boolean
  user?: User
  existingUserIds: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', user: User): void
  (e: 'editPermissions', userId: number | undefined): void
}>()

const { t } = useI18n()
const { fetch } = useKeycloak()
const { notifyError } = useNotify()

const isEdit = computed(() => !!props.user)
const localModelValue = ref(props.modelValue)
watch(() => props.modelValue, val => localModelValue.value = val)
watch(localModelValue, val => emit('update:modelValue', val))

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
  () => props.modelValue,
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
const userTypeOptions = [
  { label: 'Operator', value: 1 },
  { label: 'Other', value: 2 },
]

async function saveUser() {
  if (formRef.value && !(await formRef.value.validate?.()))
    return

  try {
    let res: any
    if (isEdit.value) {
      res = await fetch(`/api/user-definitions/${props.user!.userId}`, {
        method: 'PUT',
        body: {
          ...form.value,
        },
      })
    } else {
      res = await fetch(`/api/user-definitions/route`, {
        method: 'POST',
        body: {
          ...form.value,
        },
      })
    }

    emit('saved', { ...form.value, userId: props.user?.userId })
    localModelValue.value = false
  } catch (err: any) {
    if (err?.statusCode === 400) {
      console.error('Bu ID zaten mevcut:', err.statusMessage)
      notifyError('Bu ID zaten mevcut')
    } else {
      console.error('Kullanıcı kaydedilirken hata:', err)
    }
  }
}
</script>

<template>
  <q-dialog v-model="localModelValue" persistent>
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
            @click="localModelValue = false"
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
            label="Kullanıcı ID"
            type="number"
            :rules="[val => !!val || 'ID gerekli',
                     val => val > 0 || 'ID pozitif olmalı',
                     val => (!isEdit && !props.existingUserIds.includes(Number(val)))
                       || (isEdit && (Number(val) === props.user?.userId || !props.existingUserIds.includes(Number(val))))
                       || 'Bu ID zaten mevcut',
            ]"
            dense
            autofocus
            outlined
          />
          <q-input
            v-model="form.userName"
            label="Ad"
            :rules="[val => !!val || 'Ad gerekli']"
            dense
            outlined
            autofocus
          />
          <q-input
            v-model="form.userSurname"
            label="Soyad"
            :rules="[val => !!val || 'Soyad gerekli']"
            dense
            outlined
          />
          <q-input
            v-model="form.userPass"
            label="Parola"
            :rules="[val => isEdit || !!val || 'Parola gerekli']"
            dense
            outlined
          />
          <q-select
            v-model="form.userType"
            :options="userTypeOptions"
            map-options
            label="Tip"
            options-dense
            dense
            outlined
          />
          <q-toggle
            v-model="form.userActive"
            label="Aktif"
            dense
          />
          <q-input
            v-model="form.userInfo"
            label="Info"
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
          @click="localModelValue = false"
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
