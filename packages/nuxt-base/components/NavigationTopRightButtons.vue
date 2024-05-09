<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n/dist/runtime/composables'
import { useKeycloak } from '../composables/useKeycloak'

const { t, locale, locales } = useI18n({ useScope: 'local' })
const { setLocale } = useI18n()
// TODO: it should not be set 'tr' as default, take it from user location or sth etc
const showAbout = ref(false)
const about = ref()
const localeIcons = {
  tr: 'twemoji:flag-for-flag-turkey',
  en: 'twemoji:flag-united-states',
} as Record<string, string>

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(l => l.code !== locale.value)
})
// setLocal on lang change
const keycloak = useKeycloak()

keycloak.onReady(() => {
  keycloak.loadUserProfile()
})

async function showAboutPopup() {
  about.value = await $fetch('/api/properties')
  showAbout.value = true
}
function changeLanguage(lang: any) {
  setLocale(lang.code)
}
</script>

<template>
  <div class="gap-2 flex">
    <!-- Change language button -->
    <q-btn
      flat
      class="no-dropdown-icon"
      color="white"
      icon="translate"
    >
      <q-menu>
        <q-list>
          <q-item
            v-for="(lang, index) in availableLocales" :key="index"
            v-close-popup
            clickable
            color="black"
            class="w-full"
            no-caps
            @click="changeLanguage(lang)"
          >
            <q-item-section>
              <div class="flex w-20">
                {{ lang.name }}
                <q-space />
                <Icon :name="localeIcons[lang.code]" size="24px" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <div
      v-if="!keycloak.authenticated.value"
      class="gap-2 flex"
    >
      <q-btn
        v-model="showAbout"
        flat
        color="white"
        icon="info"
        @click="showAboutPopup()"
      />
      <q-btn
        flat
        color="white"
        :label="t('login')"
        icon-right="login"
        @click="keycloak.login()"
      />
    </div>
    <!-- If user is signed in -->
    <q-btn
      v-else
      flat
      color="white"
      icon-right="person"
      :label="keycloak.userProfile.value?.firstName"
      no-caps
    >
      <q-menu class="min-w-35">
        <q-list>
          <q-item>
            <q-item-section class="text-4 whitespace-nowrap">
              {{ keycloak.userProfile.value?.firstName }} {{ keycloak.userProfile.value?.lastName }}
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item
            v-close-popup
            clickable
            class="flex items-center justify-center"
            @click="showAboutPopup()"
          >
            <q-item-section>
              {{ t('about') }}
            </q-item-section>
            <q-icon name="info" size="sm" />
          </q-item>
          <q-item
            v-close-popup
            class="flex items-center justify-center"
            clickable
            @click="keycloak.logout()"
          >
            <q-item-section>
              {{ t('logout') }}
            </q-item-section>
            <q-icon name="logout" size="sm" />
          </q-item>
        </q-list>
      </q-menu>
      <!-- <q-btn
          v-model="showAbout"
          v-close-popup
          color="black"
          class="w-full"
          no-caps
          icon-right="info"
          :label="t('about')"
          @click="showAboutPopup()"
        />
        <q-btn
          v-close-popup
          color="black"
          no-caps

          icon-right="logout"
          class="w-full"
          :label="t('logout')"
          @click="keycloak.logout()"
        /> -->
    </q-btn>
    <!-- About dialog -->
    <q-dialog v-model="showAbout">
      <q-card>
        <q-card-section class="w-80 row items-center q-pb-none">
          <div class="text-6">
            {{ t('aboutApp') }}
          </div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
          />
        </q-card-section>
        <q-card-section class="text-4">
          <div
            v-for="(key, value) in about"
            :key="key"
            class="flex justify-between"
          >
            <span>
              {{ t(`${value}`) }} :
            </span>
            <span>
              {{ key }}
            </span>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
  .no-dropdown-icon :deep(.q-btn-dropdown__arrow) {
    display: none;
  }
</style>

<i18n lang="json">
{
  "en": {
    "about": "About",
    "aboutApp": "About Application",
    "login": "Login",
    "logout": "Logout",
    "name": "Name",
    "version": "Version",
    "buildDate": "Build date",
    "commitHash": "Commit hash",
    "nodeVersion": "Node version"
  },
  "tr": {
    "about": "Hakkında",
    "aboutApp": "Uygulama Hakkında",
    "login": "Giriş Yap",
    "logout": "Çıkış",
    "name": "İsim",
    "version": "Versiyon",
    "buildDate": "Yükleme tarihi",
    "commitHash": "Commit Hash",
    "nodeVersion": "Node versiyonu"
  }
}
</i18n>
