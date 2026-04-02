<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NList,
  NListItem,
  NButton,
  NEmpty,
  NSpin,
  NIcon,
  NTag,
  NBadge,
  NPagination,
  NSpace,
} from 'naive-ui'
import {
  NotificationsOutline,
  Notifications,
  ChatbubbleOutline,
  HeartOutline,
  MailOutline,
  InformationCircleOutline,
  CheckmarkDoneOutline,
} from '@vicons/ionicons5'
import { useNotificationStore } from '@/stores/notification'
import { formatRelativeTime } from '@/utils'
import type { Notification } from '@/types'

const router = useRouter()
const message = useMessage()
const notificationStore = useNotificationStore()

const currentPage = ref(1)
const pageSize = 10

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

function getNotificationTypeLabel(type: Notification['type']) {
  switch (type) {
    case 'COMMENT_REPLY':
      return '评论回复'
    case 'POST_LIKE':
      return '帖子点赞'
    case 'COMMENT_LIKE':
      return '评论点赞'
    case 'NEW_MESSAGE':
      return '新消息'
    case 'SYSTEM':
      return '系统通知'
    default:
      return '通知'
  }
}

function getNotificationTypeTag(type: Notification['type']) {
  switch (type) {
    case 'COMMENT_REPLY':
      return 'info'
    case 'POST_LIKE':
    case 'COMMENT_LIKE':
      return 'error'
    case 'NEW_MESSAGE':
      return 'success'
    case 'SYSTEM':
      return 'warning'
    default:
      return 'default'
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
  message.success('已全部标记为已读')
}

async function handleNotificationClick(notification: Notification) {
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }
  if (notification.link) {
    router.push(notification.link)
  }
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await notificationStore.fetchNotifications(page, pageSize)
}

async function handleDelete(id: string) {
  await notificationStore.deleteNotification(id)
  message.success('通知已删除')
}

onMounted(async () => {
  await notificationStore.fetchNotifications(1, pageSize)
})
</script>

<template>
  <div class="notifications-view">
    <n-card title="通知中心">
      <template #header-extra>
        <n-button
          v-if="notificationStore.unreadCount > 0"
          size="small"
          @click="handleMarkAllAsRead"
        >
          <template #icon>
            <n-icon :component="CheckmarkDoneOutline" />
          </template>
          全部标记已读
        </n-button>
      </template>

      <n-spin :show="notificationStore.isLoading">
        <n-empty
          v-if="!notificationStore.isLoading && notificationStore.notifications.length === 0"
          description="暂无通知"
        />
        <n-list v-else hoverable>
          <n-list-item
            v-for="item in notificationStore.notifications"
            :key="item.id"
            class="notification-item"
            :class="{ 'notification-item--unread': !item.isRead }"
            @click="handleNotificationClick(item)"
          >
            <template #prefix>
              <n-icon
                :component="getNotificationIcon(item.type)"
                :size="24"
                :color="item.isRead ? '#999' : '#18a058'"
              />
            </template>
            <div class="notification-item__content">
              <div class="notification-item__header">
                <n-tag
                  :type="getNotificationTypeTag(item.type)"
                  size="small"
                  :bordered="false"
                >
                  {{ getNotificationTypeLabel(item.type) }}
                </n-tag>
                <span class="notification-item__time">
                  {{ formatRelativeTime(item.createdAt) }}
                </span>
              </div>
              <div class="notification-item__title">{{ item.title }}</div>
              <div class="notification-item__body">{{ item.content }}</div>
            </div>
            <template #suffix>
              <n-button
                text
                size="tiny"
                @click.stop="handleDelete(item.id)"
              >
                删除
              </n-button>
            </template>
          </n-list-item>
        </n-list>
      </n-spin>

      <div v-if="notificationStore.notifications.length > 0" class="notifications-pagination">
        <n-pagination
          :page="currentPage"
          :page-size="pageSize"
          :item-count="100"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.notifications-view {
  max-width: 800px;
  margin: 0 auto;
}

.notification-item {
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item--unread {
  background: #f0faf5;
}

.notification-item--unread .notification-item__title {
  font-weight: 600;
}

.notification-item__content {
  flex: 1;
  min-width: 0;
}

.notification-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-item__time {
  font-size: 12px;
  color: #999;
}

.notification-item__title {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.notification-item__body {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notifications-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
