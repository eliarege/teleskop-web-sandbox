<script lang ="ts" setup>
//REPLACED BY KEYCLOAK
const { t } = useI18n()
const q = useQuasar()

const name = ref('')
const password = ref(null)
const accept = ref(false)

function onSubmit() {
  q.notify({
    position: 'top',
    color: 'green-4',
    textColor: 'white',
    icon: 'cloud_done',
    message: t('LoggedIn'),
    timeout: 3000,
  })
  //dataStore.$patch({ user: { username: name.value } })
  onReset()
}

function onReset() {
  name.value = ''
  password.value = null
  accept.value = false
}

function onForgotPassword() {
  console.log('Forgot Password')
}
</script>

<template>
  <QForm
    style="width: 400px"
    @submit="onSubmit"
    @reset="onReset"
  >
    <QInput
      v-model="name"
      filled
      :label="t('Username')"
      lazy-rules="ondemand"
      :rules="[(val: string) => val && val.length > 0 || '']"
    />
    <QInput
      v-model="password"
      filled
      type="password"
      :label="t('Password')"
      lazy-rules="ondemand"
      :rules="[(val: string) => val !== null && val !== '' || '']"
    />
    <div class="q-mt-md">
      <QBtn
        :label="t('Login')"
        type="submit"
        color="primary"
      />
      <QBtn
        :label="t('Reset')"
        type="reset"
        color="primary"
        flat
        class="q-ml-sm"
      />
      <div class="flex-center mt-5">
        <span class="text-primary underline cursor-pointer" @click="onForgotPassword">{{ t('ForgotPassword') }}</span>
      </div>
    </div>
  </QForm>
</template>
