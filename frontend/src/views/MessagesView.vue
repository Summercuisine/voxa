<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NInput,
  NButton,
  NAvatar,
  NEmpty,
  NSpin,
  NBadge,
  NScrollbar,
  NTag,
} from 'naive-ui'
import { SearchOutline, SendOutline } from '@vicons/ionicons5'
import { getConversations, getMessages, sendMessage, markAsRead, createConversation } from '@/api/messages'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { formatRelativeTime, truncateText, getUserAvatar } from '@/utils'
import type { Conversation, Message } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 会话列表状态
const conversations = ref<Conversation[]>([])
const conversationsLoading = ref(false)
const searchQuery = ref('')
const activeConversationId = ref<string | null>(null)

// 聊天状态
const messages = ref<Message[]>([])
const messagesLoading = ref(false)
const newMessageContent = ref('')
const sendingMessage = ref(false)
const messagesScrollbarRef = ref<InstanceType<typeof NScrollbar> | null>(null)

// 获取对方用户信息
function getOtherParticipant(conversation: Conversation | null | undefined) {
  if (!conversation) return undefined
  return conversation.participants.find(p => p.userId !== userStore.currentUser?.id)
}

// 过滤会话
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conv => {
    const other = getOtherParticipant(conv)
    if (!other) return false
    return other.user.username.toLowerCase().includes(query)
  })
})

// 当前选中的会话
const activeConversation = computed(() => {
  if (!activeConversationId.value) return null
  return conversations.value.find(c => c.id === activeConversationId.value) ?? null
})

// 获取会话列表
async function fetchConversations() {
  conversationsLoading.value = true
  try {
    const res = await getConversations()
    conversations.value = res.data
  } catch {
    message.error('获取会话列表失败')
  } finally {
    conversationsLoading.value = false
  }
}

// 选择会话
async function selectConversation(conversationId: string) {
  activeConversationId.value = conversationId
  router.push(`/messages/${conversationId}`)
  await fetchMessages(conversationId)
  // 标记为已读
  try {
    await markAsRead(conversationId)
    messageStore.clearUnread()
  } catch {
    // 静默处理
  }
}

// 获取消息列表
async function fetchMessages(conversationId: string) {
  messagesLoading.value = true
  try {
    const res = await getMessages(conversationId, { limit: 50 })
    messages.value = res.data
    await nextTick()
    scrollToBottom()
  } catch {
    message.error('获取消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// 发送消息
async function handleSendMessage() {
  if (!newMessageContent.value.trim() || !activeConversationId.value) return
  sendingMessage.value = true
  try {
    const msg = await sendMessage(activeConversationId.value, newMessageContent.value.trim())
    messages.value.push(msg)
    newMessageContent.value = ''
    await nextTick()
    scrollToBottom()
  } catch {
    message.error('发送消息失败')
  } finally {
    sendingMessage.value = false
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesScrollbarRef.value) {
    const container = messagesScrollbarRef.value.$el?.querySelector('.n-scrollbar-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

// 获取会话最后一条消息预览
function getLastMessagePreview(conversation: Conversation): string {
  if (conversation.messages && conversation.messages.length > 0) {
    const lastMsg = conversation.messages[conversation.messages.length - 1]
    return truncateText(lastMsg?.content ?? '', 30)
  }
  return ''
}

// 判断用户是否为 Bot
function isBotUser(user?: { role?: string }): boolean {
  return user?.role === 'ADMIN'
}

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

// 初始化
onMounted(async () => {
  await fetchConversations()
  // 如果 URL 中有会话 ID，自动选中
  if (route.params.id) {
    const convId = route.params.id as string
    activeConversationId.value = convId
    await fetchMessages(convId)
    try {
      await markAsRead(convId)
    } catch {
      // 静默处理
    }
  }
})

// 监听路由变化
watch(() => route.params.id, async (newId) => {
  if (newId) {
    const convId = newId as string
    activeConversationId.value = convId
    await fetchMessages(convId)
    try {
      await markAsRead(convId)
    } catch {
      // 静默处理
    }
  }
})
</script>

<template>
  <div class="messages-page">
    <n-layout has-sider style="height: calc(100vh - 104px); border: 1px solid rgb(239, 239, 245); border-radius: 8px; overflow: hidden;">
      <!-- 左侧会话列表 -->
      <n-layout-sider
        bordered
        :width="340"
        :min-width="340"
        style="display: flex; flex-direction: column;"
      >
        <div class="conversation-header">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">私信</h3>
        </div>
        <div class="conversation-search">
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索会话..."
            clearable
            size="small"
          >
            <template #prefix>
              <n-icon :size="16">
                <SearchOutline />
              </n-icon>
            </template>
          </n-input>
        </div>
        <div class="conversation-list" style="flex: 1; overflow: auto;">
          <n-spin :show="conversationsLoading">
            <template v-if="filteredConversations.length === 0 && !conversationsLoading">
              <div style="padding: 40px 16px; text-align: center;">
                <n-empty description="暂无会话" />
              </div>
            </template>
            <div
              v-for="conv in filteredConversations"
              :key="conv.id"
              class="conversation-item"
              :class="{ active: activeConversationId === conv.id }"
              @click="selectConversation(conv.id)"
            >
              <n-avatar
                :src="getUserAvatar(getOtherParticipant(conv)?.user?.avatar, getOtherParticipant(conv)?.user?.username)"
                round
                :size="42"
              />
              <div class="conversation-info">
                <div class="conversation-top">
                  <span class="conversation-name">
                    {{ getOtherParticipant(conv)?.user?.username }}
                    <n-tag v-if="isBotUser(getOtherParticipant(conv)?.user)" size="tiny" type="info" round style="margin-left: 4px;">
                      Bot
                    </n-tag>
                  </span>
                  <span class="conversation-time">
                    {{ formatRelativeTime(conv.lastMessageAt) }}
                  </span>
                </div>
                <div class="conversation-bottom">
                  <span class="conversation-preview">
                    {{ getLastMessagePreview(conv) }}
                  </span>
                  <n-badge
                    v-if="conv._count && conv._count.messages > 0"
                    :value="conv._count.messages"
                    :max="99"
                    type="error"
                    :show="false"
                  />
                </div>
              </div>
            </div>
          </n-spin>
        </div>
      </n-layout-sider>

      <!-- 右侧聊天区域 -->
      <n-layout-content style="display: flex; flex-direction: column; background: #f9fafb;">
        <template v-if="activeConversationId">
          <!-- 聊天头部 -->
          <div class="chat-header">
            <n-avatar
              :src="getUserAvatar(
                getOtherParticipant(activeConversation)?.user?.avatar,
                getOtherParticipant(activeConversation)?.user?.username
              )"
              round
              :size="36"
            />
            <div class="chat-header-info">
              <span class="chat-header-name">
                {{ getOtherParticipant(activeConversation)?.user?.username }}
                <n-tag v-if="isBotUser(getOtherParticipant(activeConversation)?.user)" size="tiny" type="info" round style="margin-left: 4px;">
                  Bot
                </n-tag>
              </span>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="chat-messages" style="flex: 1; overflow: hidden;">
            <n-spin :show="messagesLoading">
              <n-scrollbar ref="messagesScrollbarRef" style="max-height: 100%;">
                <div class="messages-container">
                  <div
                    v-for="msg in messages"
                    :key="msg.id"
                    class="message-wrapper"
                    :class="{ 'is-self': msg.senderId === userStore.currentUser?.id }"
                  >
                    <n-avatar
                      :src="getUserAvatar(msg.sender?.avatar, msg.sender?.username)"
                      round
                      :size="32"
                      class="message-avatar"
                    />
                    <div class="message-content-wrapper">
                      <div class="message-bubble" :class="{ 'bubble-self': msg.senderId === userStore.currentUser?.id }">
                        {{ msg.content }}
                      </div>
                      <div class="message-time">
                        {{ formatRelativeTime(msg.createdAt) }}
                      </div>
                    </div>
                  </div>
                </div>
              </n-scrollbar>
            </n-spin>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input-area">
            <n-input
              v-model:value="newMessageContent"
              type="textarea"
              placeholder="输入消息..."
              :autosize="{ minRows: 1, maxRows: 4 }"
              @keydown="handleKeyDown"
            />
            <n-button
              type="primary"
              :disabled="!newMessageContent.trim() || sendingMessage"
              :loading="sendingMessage"
              @click="handleSendMessage"
              style="margin-left: 8px; align-self: flex-end;"
            >
              <template #icon>
                <n-icon><SendOutline /></n-icon>
              </template>
              发送
            </n-button>
          </div>
        </template>

        <!-- 空状态 -->
        <template v-else>
          <div class="chat-empty">
            <n-empty description="选择一个会话开始聊天" />
          </div>
        </template>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<style scoped>
.messages-page {
  max-width: 1200px;
  margin: 0 auto;
}

.conversation-header {
  padding: 16px;
  border-bottom: 1px solid rgb(239, 239, 245);
}

.conversation-search {
  padding: 12px 16px;
  border-bottom: 1px solid rgb(239, 239, 245);
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.conversation-item:hover {
  background-color: rgb(243, 243, 245);
}

.conversation-item.active {
  background-color: rgb(239, 247, 242);
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-name {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.conversation-time {
  font-size: 12px;
  color: rgb(158, 158, 158);
  flex-shrink: 0;
}

.conversation-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-preview {
  font-size: 13px;
  color: rgb(118, 118, 118);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgb(239, 239, 245);
  background: #fff;
}

.chat-header-info {
  display: flex;
  flex-direction: column;
}

.chat-header-name {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.messages-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.message-wrapper {
  display: flex;
  gap: 8px;
  max-width: 70%;
}

.message-wrapper.is-self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message-wrapper.is-self .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  word-break: break-word;
}

.message-bubble.bubble-self {
  background: #18a058;
  color: #fff;
}

.message-time {
  font-size: 11px;
  color: rgb(158, 158, 158);
  padding: 0 4px;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  padding: 12px 20px;
  border-top: 1px solid rgb(239, 239, 245);
  background: #fff;
}
</style>
