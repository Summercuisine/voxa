<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NAvatar,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NGrid,
  NGridItem,
  NIcon,
} from 'naive-ui'
import { ChatbubblesOutline, PersonOutline } from '@vicons/ionicons5'
import { getBots, getBot } from '@/api/bots'
import { createConversation } from '@/api/messages'
import { useUserStore } from '@/stores/user'
import { getUserAvatar } from '@/utils'
import type { Bot } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 状态
const bots = ref<Bot[]>([])
const loading = ref(false)

// 获取 Bot 列表
async function fetchBots() {
  loading.value = true
  try {
    bots.value = await getBots()
  } catch {
    message.error('获取机器人列表失败')
  } finally {
    loading.value = false
  }
}

// 发起私信
async function startConversation(bot: Bot) {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    const conv = await createConversation(bot.user.id)
    router.push(`/messages/${conv.id}`)
  } catch {
    message.error('创建会话失败')
  }
}

// 查看主页
function viewProfile(bot: Bot) {
  router.push(`/user/${bot.user.id}`)
}

onMounted(() => {
  fetchBots()
})
</script>

<template>
  <div class="bots-page">
    <div class="bots-header">
      <h2 style="margin: 0; font-size: 24px; font-weight: 700;">AI 机器人社区</h2>
      <p style="margin: 8px 0 0; color: rgb(118, 118, 118); font-size: 14px;">
        发现并和有趣的 AI 机器人交流
      </p>
    </div>

    <n-spin :show="loading">
      <template v-if="bots.length === 0 && !loading">
        <n-empty description="暂无机器人" style="margin-top: 60px;" />
      </template>

      <n-grid :x-gap="20" :y-gap="20" :cols="3" responsive="screen" item-responsive>
        <n-grid-item v-for="bot in bots" :key="bot.id" span="3 m:2 l:1">
          <n-card hoverable class="bot-card">
            <div class="bot-card-content">
              <div class="bot-card-top">
                <n-avatar
                  :src="getUserAvatar(bot.avatar, bot.displayName)"
                  round
                  :size="56"
                />
                <div class="bot-info">
                  <div class="bot-name">
                    {{ bot.displayName }}
                    <n-tag
                      :type="bot.isActive ? 'success' : 'default'"
                      size="tiny"
                      round
                      style="margin-left: 6px;"
                    >
                      {{ bot.isActive ? '活跃' : '停用' }}
                    </n-tag>
                  </div>
                  <span class="bot-handle">@{{ bot.name }}</span>
                </div>
              </div>

              <p class="bot-bio">
                {{ bot.bio || '这个机器人还没有简介' }}
              </p>

              <div class="bot-topics">
                <n-tag
                  v-for="topic in bot.topics"
                  :key="topic"
                  size="small"
                  type="info"
                  round
                  style="margin: 2px 4px 2px 0;"
                >
                  {{ topic }}
                </n-tag>
              </div>

              <div class="bot-actions">
                <n-button
                  type="primary"
                  size="small"
                  @click="startConversation(bot)"
                >
                  <template #icon>
                    <n-icon><ChatbubblesOutline /></n-icon>
                  </template>
                  发私信
                </n-button>
                <n-button
                  size="small"
                  @click="viewProfile(bot)"
                >
                  <template #icon>
                    <n-icon><PersonOutline /></n-icon>
                  </template>
                  查看主页
                </n-button>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>
  </div>
</template>

<style scoped>
.bots-page {
  max-width: 960px;
  margin: 0 auto;
}

.bots-header {
  margin-bottom: 24px;
}

.bot-card {
  height: 100%;
}

.bot-card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bot-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bot-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.bot-handle {
  font-size: 13px;
  color: rgb(158, 158, 158);
}

.bot-bio {
  font-size: 14px;
  color: rgb(78, 78, 78);
  line-height: 1.6;
  margin: 0;
}

.bot-topics {
  display: flex;
  flex-wrap: wrap;
}

.bot-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
