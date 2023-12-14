<script setup lang="ts">
import { matDisplaySettings, matEditCalendar, matPendingActions, matPreview } from '@quasar/extras/material-icons'

const ptSettings = reactive([
  {
    name: 'view',
    icon: matPreview,
    label: 'Görünüm',
    panel: {
      title: 'Planlama Alanı - İş Emri Görünümleri',
    },
  },
  {
    name: 'general',
    icon: matEditCalendar,
    label: 'Genel',
    panel: {
      title: '',
    },
  },
  {
    name: 'settings',
    icon: matDisplaySettings,
    label: 'Gösterge Seçenekleri',
    panel: {
      title: '',
    },
  },
  {
    name: 'unplanned',
    icon: matPendingActions,
    label: 'Bekleyen İş Emirleri',
    panel: {
      title: '',
    },
  },
],
)
const viewDropdown = reactive([
  {
    label: 'Test1',
  },
  {
    label: 'Test2',
  },
  {
    label: 'Test3',
  },
  {
    label: 'Test4',
  },
])
const tab = ref(ptSettings[0].name)
const splitterModel = ref(20)
</script>

<template>
  <div class="bg-white! !w-80vw h-full" @click.stop.prevent>
    <q-splitter
      v-model="splitterModel"
    >
      <template #before>
        <q-tabs
          v-model="tab"
          vertical
          class="text-blue"
        >
          <q-tab
            v-for="(item, idx) in ptSettings"
            :key="idx"
            :name="item.name"
            :icon="item.icon"
            :label="item.label"
          />
        </q-tabs>
      </template>

      <template #after>
        <q-tab-panels
          v-model="tab"
          animated
          swipeable
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel name="view">
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-t">
              <h1>Tamamlanmış İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-for="(item, idx) in viewDropdown"
                      :key="idx"
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>{{ item.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-for="(item, idx) in viewDropdown"
                      :key="idx"
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>{{ item.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-b">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="general">
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-t">
              <h1>Tamamlanmış İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-b">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="settings">
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-t">
              <h1>Tamamlanmış İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-b">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="unplanned">
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-t">
              <h1>Tamamlanmış İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
            <div class="w-full h-full border-1px border-solid border-gray-500/50 rounded-b">
              <h1>Devam eden İş Emirleri</h1>
              <div class="flex-center gap-5">
                <span>İş Emri Metni</span>
                <q-btn-dropdown color="primary" label="Dropdown Button">
                  <q-list>
                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item
                      v-close-popup
                      clickable
                    >
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<style scoped lang="postcss">
</style>
