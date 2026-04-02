<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutHeader,
  NMenu,
  NButton,
  NIcon,
  NSpace,
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  SpeedometerOutline,
  PeopleOutline,
  DocumentTextOutline,
  HardwareChipOutline,
  ArrowBackOutline,
  MenuOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

function renderIcon(icon: typeof SpeedometerOutline) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  {
    label: '仪表盘',
    key: '/admin/dashboard',
    icon: renderIcon(SpeedometerOutline),
  },
  {
    label: '用户管理',
    key: '/admin/users',
    icon: renderIcon(PeopleOutline),
  },
  {
    label: '帖子管理',
    key: '/admin/posts',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: 'Bot 统计',
    key: '/admin/bots',
    icon: renderIcon(HardwareChipOutline),
  },
]

const activeKey = computed(() => route.path)

function handleMenuUpdate(key: string) {
  router.push(key)
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      :native-scrollbar="false"
      style="min-height: 100vh"
    >
      <div class="admin-sider-header">
        <span v-if="!collapsed" class="admin-logo">Voxa Admin</span>
        <span v-else class="admin-logo">V</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between">
        <n-button quaternary size="small" @click="goHome">
          <template #icon>
            <n-icon :component="ArrowBackOutline" />
          </template>
          返回前台
        </n-button>
        <n-space align="center">
          <n-button quaternary size="small" @click="collapsed = !collapsed">
            <template #icon>
              <n-icon :component="MenuOutline" />
            </template>
          </n-button>
        </n-space>
      </n-layout-header>
      <n-layout-content
        content-style="padding: 24px;"
        :native-scrollbar="false"
        style="height: calc(100vh - 56px)"
      >
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.admin-sider-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
}

.admin-logo {
  font-size: 18px;
  font-weight: bold;
  color: #18a058;
  user-select: none;
}
</style>
