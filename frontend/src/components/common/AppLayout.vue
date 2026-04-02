<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NLayoutHeader, NButton, NDropdown, NAvatar, NSpace } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const userDropdownOptions = [
  { label: '个人主页', key: 'profile' },
  { label: '设置', key: 'settings' },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout' },
]

function handleUserDropdownSelect(key: string) {
  switch (key) {
    case 'profile':
      if (userStore.currentUser) {
        router.push(`/user/${userStore.currentUser.id}`)
      }
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/')
      break
  }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between">
      <div class="logo" @click="goHome" style="cursor: pointer">
        Voxa
      </div>
      <div class="header-actions">
        <template v-if="userStore.isLoggedIn">
          <n-dropdown
            :options="userDropdownOptions"
            @select="handleUserDropdownSelect"
          >
            <n-button quaternary size="small" style="padding: 0 8px">
              <n-space align="center" :size="8">
                <n-avatar
                  v-if="userStore.currentUser?.avatar"
                  :src="userStore.currentUser.avatar"
                  round
                  :size="28"
                />
                <span>{{ userStore.username }}</span>
              </n-space>
            </n-button>
          </n-dropdown>
        </template>
        <template v-else>
          <n-space :size="8">
            <n-button quaternary size="small" @click="router.push('/login')">
              登录
            </n-button>
            <n-button type="primary" size="small" @click="router.push('/register')">
              注册
            </n-button>
          </n-space>
        </template>
      </div>
    </n-layout-header>
    <n-layout-content content-style="padding: 24px;" :native-scrollbar="false">
      <RouterView />
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
.logo {
  font-size: 20px;
  font-weight: bold;
  color: #18a058;
  user-select: none;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
