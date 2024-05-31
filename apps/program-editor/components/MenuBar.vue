<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { locale, locales, setLocale } = useI18n()
const { dark } = useQuasar()

const menuItems = computed(() => [
  {
    name: t('menu.system'),
    children: [
      {
        name: t('menu.print'),
        children: [
          { name: t('menu.programList') },
          { name: t('menu.program') },
        ],
      },
      { name: t('menu.exportToExcel') },
      { name: t('menu.exit') },
    ],
  },
  {
    name: t('menu.edit'),
    children: [
      { name: t('menu.cut') },
      { name: t('menu.copy') },
      { name: t('menu.findReplace') },
      { name: t('menu.filter') },
    ],
  },
  { name: t('menu.tools'), children: [] },
  {
    name: t('menu.program'),
    children: [
      { name: t('menu.newProgram') },
      { name: t('menu.editProgram') },
      { name: t('menu.deleteProgram') },
      { name: t('menu.sendProgram') },
      { name: t('menu.getProgram') },
      { name: t('menu.getAllPrograms') },
      { name: t('menu.sendAllPrograms') },
      { name: t('menu.rename') },
    ],
  },
  { name: t('menu.settings'), children: [] },
  {
    name: t('menu.help'),
    children: [
      { name: t('menu.about') },
    ],
  },
])
</script>

<template>
  <div class="q-pa-ma">
    <div class="q-gutter-ma flex">
      <QBtn
        :color="dark.isActive ? 'white' : 'grey-9'"
        to="/"
        icon="home"
        flat
      />
      <QBtn
        v-for="(item, index) in menuItems"
        :key="index"
        :color="dark.isActive ? 'white' : 'grey-9'"
        flat
        :label="item.name"
      >
        <QMenu>
          <QItem
            v-for="(subItem, index2) in item.children"
            :key="`${index} - ${index2}`"
            v-close-popup
            clickable
            dense
          >
            <QItemSection>{{ subItem.name }}</QItemSection>
            <QItemSection
              v-if="subItem.children && subItem.children.length > 0"
              avatar
              icon
              class="q-ml-xs"
              side
            >
              <QIcon name="keyboard_arrow_right" />
            </QItemSection>
            <QMenu>
              <QItem
                v-for="(subSubItem, index3) in subItem.children"
                :key="`${index} - ${index2} - ${index3}`"
                clickable
                dense
              >
                <QItemSection>{{ subSubItem.name }}</QItemSection>
              </QItem>
            </QMenu>
          </QItem>
        </QMenu>
      </QBtn>
      <QSpace />
      <!-- <QToggle v-model="editor.isDragging" icon="pan_tool" /> -->
      <div>
        <QBtn
          :color="dark.isActive ? 'white' : 'grey-8'"
          icon="language"
          flat
          round
        >
          <QMenu>
            <QItem
              v-for="(lang, index) in locales"
              :key="index"
              v-close-popup
              clickable
              dense
              :active="locale === lang.code"
              @click="setLocale(lang.code)"
            >
              <QItemSection> {{ t(lang.code) }} </QItemSection>
            </QItem>
          </QMenu>
        </QBtn>
      </div>
      <!-- <QToggle
        class="q-mr-sm"
        :icon="dark.isActive ? 'dark_mode' : 'light_mode'"
        color="dark"
        :model-value="dark.isActive"
        @update:model-value="dark.set($event)"
      /> -->
    </div>
  </div>
</template>

<style scoped>
.q-btn {
  text-transform: capitalize;
}
</style>
