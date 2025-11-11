<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/types'

interface Permission {
  label: string
  index: number
  value: MaybeRef<boolean>
  disabled?: MaybeRef<boolean>
  _value?: boolean
}

const props = defineProps<{
  show: boolean
  selected: User
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()
const kc = useKeycloak()
const { notifyError } = useNotify()

const selectAll = ref(false)
const controllerPermission = ref(false)
const menuAccessPermission = ref(false)

const permissionsGroup1 = reactive<Permission[]>([
  { label: t('createProgram'), index: 0, value: false },
  { label: t('modifyProgram'), index: 1, value: false },
  { label: t('copyProgram'), index: 2, value: false },
  { label: t('deleteProgram'), index: 3, value: false },
  { label: t('manualCommandStarting'), index: 4, value: false },
  { label: t('accessingToSystemMenu'), index: 5, value: menuAccessPermission },
  { label: t('modifyingProgramAtRunTime'), index: 6, value: false },
  { label: t('testAuth'), index: 7, value: false },
  {
    label: t('accessingToDyeHouseParameters'),
    index: 8,
    value: computed({
      get: (): boolean => menuAccessPermission.value ? !!permissionsGroup1[8]._value : false,
      set: (v) => {
        if (menuAccessPermission.value)
          permissionsGroup1[8]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !menuAccessPermission.value),
  },
  {
    label: t('ioSettings'),
    index: 9,
    value: computed({
      get: (): boolean => menuAccessPermission.value ? !!permissionsGroup1[9]._value : false,
      set: (v) => {
        if (menuAccessPermission.value)
          permissionsGroup1[9]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !menuAccessPermission.value),
  },
  { label: t('updatingIOAndLanguage'), index: 10, value: false },
  { label: t('controllerSettings'), index: 11, value: controllerPermission },
  {
    label: t('userSettings'),
    index: 12,
    value: computed({
      get: (): boolean => controllerPermission.value ? !!permissionsGroup1[12]._value : false,
      set: (v) => {
        if (controllerPermission.value)
          permissionsGroup1[12]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !controllerPermission.value),
  },
  {
    label: t('interLocks'),
    index: 13,
    value: computed({
      get: (): boolean => menuAccessPermission.value ? !!permissionsGroup1[13]._value : false,
      set: (v) => {
        if (menuAccessPermission.value)
          permissionsGroup1[13]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !menuAccessPermission.value),
  },
  {
    label: t('calibration'),
    index: 14,
    value: computed({
      get: (): boolean => menuAccessPermission.value ? !!permissionsGroup1[14]._value : false,
      set: (v) => {
        if (menuAccessPermission.value)
          permissionsGroup1[14]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !menuAccessPermission.value),
  },
  {
    label: t('commands'),
    index: 15,
    value: computed({
      get: (): boolean => menuAccessPermission.value ? !!permissionsGroup1[15]._value : false,
      set: (v) => {
        if (menuAccessPermission.value)
          permissionsGroup1[15]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !menuAccessPermission.value),
  },
  { label: t('startingBatch'), index: 16, value: false },
  {
    label: t('equipmentMaintenancePlan'),
    index: 17,
    value: computed({
      get: (): boolean => controllerPermission.value ? !!permissionsGroup1[17]._value : false,
      set: (v) => {
        if (controllerPermission.value)
          permissionsGroup1[17]._value = v
      },
    }),
    _value: false,
    disabled: computed(() => !controllerPermission.value),
  },
  { label: t('restrictGLGPageAccessRights'), index: 18, value: false },
  { label: t('reelPumpSettings'), index: 20, value: false },
  { label: t('defineBatchParameter'), index: 24, value: false },
  { label: t('MachineConstantAndTimerConstant'), index: 25, value: false },
  { label: t('changeBatchParameter'), index: 28, value: false },
])

const permissionsGroup2 = reactive<Permission[]>(([
  { label: t('warningCommandsApprovalAuthority'), index: 0, value: true },
  { label: t('stepChangeAuthority'), index: 1, value: true },
  { label: t('changingMachineAuthority'), index: 2, value: false },
  { label: t('authorityForOperatorInterventionFreePrograms'), index: 3, value: false },
]))

const user = computed(() => props.selected)
watch(user, (_newValue, _oldValue) => {
  if (props.selected.userMode && props.selected.userMode2)
    updatePermissionsFromHex(props.selected.userMode, props.selected.userMode2)
})

function updatePermissionsFromHex(hexStringGroup1: string, hexStringGroup2: string) {
  const binaryStringGroup1 = Number.parseInt(hexStringGroup1.slice(2), 16).toString(2).padStart(32, '0')
  const binaryStringGroup2 = Number.parseInt(hexStringGroup2.slice(2), 16).toString(2).padStart(32, '0')

  // Update Group 1 permissions
  permissionsGroup1.forEach((permission) => {
    const bitPosition = permission.index
    permission.value = binaryStringGroup1.charAt(31 - bitPosition) === '1'
  })

  // Update Group 2 permissions
  permissionsGroup2.forEach((permission) => {
    const bitPosition = permission.index
    permission.value = binaryStringGroup2.charAt(31 - bitPosition) === '1'
  })
}

async function savePermissions() {
  let combinedPermissionValueGroup1 = 0
  let combinedPermissionValueGroup2 = 0

  // Group 1
  permissionsGroup1.forEach((permission: Permission) => {
    if (permission.value) {
      combinedPermissionValueGroup1 |= 1 << (permission.index)
    }
  })

  // Group 2
  permissionsGroup2.forEach((permission: Permission) => {
    if (permission.value) {
      combinedPermissionValueGroup2 |= 1 << (permission.index)
    }
  })

  const hexadecimalValueGroup1 = `0x${combinedPermissionValueGroup1.toString(16).padStart(8, '0')}`
  const hexadecimalValueGroup2 = `0x${combinedPermissionValueGroup2.toString(16).padStart(8, '0')}`

  try {
    await kc.fetch('/api/user-definitions/user-definition', {
      method: 'PUT',
      body: {
        userId: user.value.userId,
        userMode: hexadecimalValueGroup1,
        userMode2: hexadecimalValueGroup2,
      },
    })
    emit('close')
  } catch (err) {
    console.error(`Failed to update user permissions`, err)
    notifyError(t('user-permission-update-failed'))
  }
}

function toggleSelectAll() {
  const groups = [permissionsGroup1, permissionsGroup2]
  const newValue = !groups.every(g => g.every(p => p.value))
  groups.flat().forEach(p => !p.disabled && (p.value = newValue))
}
</script>

<template>
  <q-dialog
    :model-value="show"
    @hide="emit('close')"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('user-permissions') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="emit('close')"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="h-140 overflow-auto">
          <q-list>
            <q-item
              v-for="(permission, key) in [...permissionsGroup1, ...permissionsGroup2]"
              :key="key"
              dense
            >
              <q-checkbox
                v-model="permission.value"
                :label="permission.label"
                :disable="permission.disabled"
                dense
              />
            </q-item>
          </q-list>
        </div>

        <div>
          <q-checkbox
            v-model="selectAll"
            :label="selectAll ? t('deselectAll') : t('selectAll')"
            @update:model-value="toggleSelectAll"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-gray-1 dark:bg-dark-4">
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
          @click="emit('close')"
        />
        <q-btn
          :label="t('save')"
          class="bg-primary text-white"
          flat
          @click="savePermissions"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
