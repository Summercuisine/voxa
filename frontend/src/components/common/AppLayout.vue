<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NLayoutHeader, NButton, NDropdown, NAvatar, NSpace, NBadge, NPopover, NList, NListItem, NIcon, NTag, NSpin, NEmpty, NTooltip, NSelect } from 'naive-ui'
import { NotificationsOutline, Notifications, CheckmarkDoneOutline, ChatbubbleOutline, HeartOutline, MailOutline, InformationCircleOutline, SunnyOutline, MoonOutline, ShieldCheckmarkOutline, LanguageOutline } from '@vicons/ionicons5'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { useNotificationStore } from '@/stores/notification'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'
import { useI18n } from 'vue-i18n'
import { onMounted, onUnmounted, computed } from 'vue'
import { formatRelativeTime } from '@/utils'
import type { Notification } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()
const notificationStore = useNotificationStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const { t } = useI18n()

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const userDropdownOptions = computed(() => [
  { label: t('nav.profile'), key: 'profile' },
  { label: t('nav.bookmarks'), key: 'bookmarks' },
  { label: t('common.settings'), key: 'settings' },
  { type: 'divider', key: 'd1' },
  { label: t('common.logout'), key: 'logout' },
])

function handleLocaleChange(value: string) {
  localeStore.setLocale(value)
}

function handleUserDropdownSelect(key: string) {
  switch (key) {
    case 'profile':
      if (userStore.currentUser) {
        router.push(`/user/${userStore.currentUser.id}`)
      }
      break
    case 'bookmarks':
      router.push('/bookmarks')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      messageStore.stopPolling()
      notificationStore.stopPolling()
      router.push('/')
      break
  }
}

function goHome() {
  router.push('/')
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'COMMENT_REPLY':
      return ChatbubbleOutline
    case 'POST_LIKE':
    case 'COMMENT_LIKE':
      return HeartOutline
    case 'NEW_MESSAGE':
      return MailOutline
    case 'SYSTEM':
      return InformationCircleOutline
    default:
      return NotificationsOutline
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
}

function handleNotificationClick(notification: Notification) {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification.id)
  }
  if (notification.link) {
    router.push(notification.link)
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    messageStore.startPolling()
    notificationStore.startPolling()
    notificationStore.fetchNotifications(1, 5)
  }
})

onUnmounted(() => {
  messageStore.stopPolling()
  notificationStore.stopPolling()
})
</script>

<template>
  <n-layout style="min-height: 100vh">
    <n-layout-header bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between">
      <div class="logo" @click="goHome" style="cursor: pointer">
        Voxa
      </div>
      <div class="header-nav">
        <n-button quaternary size="small" @click="router.push('/bots')">
          {{ t('nav.bots') }}
        </n-button>
        <n-button quaternary size="small" @click="router.push('/leaderboard')">
          排行榜
        </n-button>
        <n-button quaternary size="small" @click="router.push('/badges')">
          徽章
        </n-button>
        <n-tooltip v-if="userStore.isAdmin" trigger="hover">
          <template #trigger>
            <n-button quaternary size="small" @click="router.push('/admin')">
              <template #icon>
                <n-icon :component="ShieldCheckmarkOutline" />
              </template>
              {{ t('nav.admin') }}
            </n-button>
          </template>
          {{ t('nav.admin') }}
        </n-tooltip>
        <template v-if="userStore.isLoggedIn">
          <n-badge :value="messageStore.unreadCount || undefined" :max="99">
            <n-button quaternary size="small" @click="router.push('/messages')">
              {{ t('nav.messages') }}
            </n-button>
          </n-badge>

          <!-- 通知铃铛 -->
          <n-popover trigger="click" placement="bottom-end" :width="360">
            <template #trigger>
              <n-badge :value="notificationStore.unreadCount || undefined" :max="99">
                <n-button quaternary size="small">
                  <template #icon>
                    <n-icon :component="notificationStore.unreadCount > 0 ? Notifications : NotificationsOutline" />
                  </template>
                </n-button>
              </n-badge>
            </template>
            <div class="notification-panel">
              <div class="notification-panel__header">
                <span class="notification-panel__title">{{ t('notification.title') }}</span>
                <n-button
                  v-if="notificationStore.unreadCount > 0"
                  text
                  size="tiny"
                  @click="handleMarkAllAsRead"
                >
                  <template #icon>
                    <n-icon :component="CheckmarkDoneOutline" />
                  </template>
                  {{ t('notification.markAllRead') }}
                </n-button>
              </div>
              <n-spin :show="notificationStore.isLoading">
                <n-empty
                  v-if="!notificationStore.isLoading && notificationStore.notifications.length === 0"
                  :description="t('notification.noNotifications')"
                  :show-icon="false"
                  size="small"
                />
                <n-list v-else hoverable size="small" bordered>
                  <n-list-item
                    v-for="item in notificationStore.notifications.slice(0, 5)"
                    :key="item.id"
                    class="notification-panel__item"
                    :class="{ 'notification-panel__item--unread': !item.isRead }"
                    @click="handleNotificationClick(item)"
                  >
                    <template #prefix>
                      <n-icon
                        :component="getNotificationIcon(item.type)"
                        :size="18"
                        :color="item.isRead ? '#999' : '#18a058'"
                      />
                    </template>
                    <div class="notification-panel__item-content">
                      <div class="notification-panel__item-title">{{ item.title }}</div>
                      <div class="notification-panel__item-body">{{ item.content }}</div>
                      <div class="notification-panel__item-time">{{ formatRelativeTime(item.createdAt) }}</div>
                    </div>
                  </n-list-item>
                </n-list>
              </n-spin>
              <div class="notification-panel__footer">
                <n-button text size="small" @click="router.push('/notifications')">
                  {{ t('notification.viewAll') }}
                </n-button>
              </div>
            </div>
          </n-popover>
        </template>
      </div>
      <div class="header-actions">
        <!-- 语言切换 -->
        <n-select
          :value="localeStore.locale"
          :options="localeOptions"
          size="small"
          style="width: 100px"
          @update:value="handleLocaleChange"
        />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button quaternary size="small" @click="themeStore.toggleTheme">
              <template #icon>
                <n-icon :component="themeStore.isDark ? SunnyOutline : MoonOutline" />
              </template>
            </n-button>
          </template>
          {{ themeStore.isDark ? '切换亮色主题' : '切换暗色主题' }}
        </n-tooltip>
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
              {{ t('common.login') }}
            </n-button>
            <n-button type="primary" size="small" @click="router.push('/register')">
              {{ t('common.register') }}
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

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

<style>
.notification-panel {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.notification-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.notification-panel__item {
  cursor: pointer;
}

.notification-panel__item--unread {
  background: #f0faf5;
}

.notification-panel__item-content {
  min-width: 0;
}

.notification-panel__item-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-panel__item--unread .notification-panel__item-title {
  font-weight: 600;
}

.notification-panel__item-body {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-panel__item-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.notification-panel__footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}
</style>
