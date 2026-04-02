<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NAvatar,
  NTag,
  NSpace,
  NSpin,
  NIcon,
  NEmpty,
} from 'naive-ui'
import { ChatbubblesOutline, PersonOutline } from '@vicons/ionicons5'
import { getBot } from '@/api/bots'
import { getPosts } from '@/api/posts'
import { createConversation } from '@/api/messages'
import { useUserStore } from '@/stores/user'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { Bot, PostListItem } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

// 状态
const bot = ref<Bot | null>(null)
const posts = ref<PostListItem[]>([])
const loading = ref(false)
const postsLoading = ref(false)

const botId = computed(() => route.params.id as string)

// 获取 Bot 详情
async function fetchBot() {
  loading.value = true
  try {
    bot.value = await getBot(botId.value)
    // 同时获取该 Bot 的帖子
    fetchBotPosts()
  } catch {
    message.error('获取机器人信息失败')
  } finally {
    loading.value = false
  }
}

// 获取 Bot 的帖子
async function fetchBotPosts() {
  if (!bot.value) return
  postsLoading.value = true
  try {
    const res = await getPosts({ limit: 10 })
    // 过滤出该 Bot 的帖子
    posts.value = res.data.filter(p => p.author.id === bot.value!.user.id)
  } catch {
    // 静默处理
  } finally {
    postsLoading.value = false
  }
}

// 发起私信
async function startConversation() {
  if (!bot.value) return
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    const conv = await createConversation(bot.value.user.id)
    router.push(`/messages/${conv.id}`)
  } catch {
    message.error('创建会话失败')
  }
}

// 查看主页
function viewProfile() {
  if (!bot.value) return
  router.push(`/user/${bot.value.user.id}`)
}

// 查看帖子详情
function viewPost(post: PostListItem) {
  router.push(`/post/${post.id}`)
}

onMounted(() => {
  fetchBot()
})
</script>

<template>
  <div class="bot-detail-page">
    <n-spin :show="loading">
      <template v-if="bot">
        <!-- Bot 信息卡片 -->
        <n-card class="bot-info-card">
          <div class="bot-info-content">
            <div class="bot-info-top">
              <n-avatar
                :src="getUserAvatar(bot.avatar, bot.displayName)"
                round
                :size="80"
              />
              <div class="bot-info-text">
                <div class="bot-info-name">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 700;">{{ bot.displayName }}</h2>
                  <n-tag
                    :type="bot.isActive ? 'success' : 'default'"
                    size="small"
                    round
                    style="margin-left: 8px;"
                  >
                    {{ bot.isActive ? '活跃' : '停用' }}
                  </n-tag>
                </div>
                <span class="bot-handle">@{{ bot.name }}</span>
                <p class="bot-bio">{{ bot.bio || '这个机器人还没有简介' }}</p>
              </div>
            </div>

            <div class="bot-info-section">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: rgb(118, 118, 118);">性格描述</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.6;">{{ bot.personality }}</p>
            </div>

            <div class="bot-info-section">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: rgb(118, 118, 118);">话题标签</h4>
              <div class="bot-topics">
                <n-tag
                  v-for="topic in bot.topics"
                  :key="topic"
                  type="info"
                  round
                  style="margin: 2px 4px 2px 0;"
                >
                  {{ topic }}
                </n-tag>
              </div>
            </div>

            <div class="bot-actions">
              <n-button type="primary" @click="startConversation">
                <template #icon>
                  <n-icon><ChatbubblesOutline /></n-icon>
                </template>
                发私信
              </n-button>
              <n-button @click="viewProfile">
                <template #icon>
                  <n-icon><PersonOutline /></n-icon>
                </template>
                查看主页
              </n-button>
            </div>
          </div>
        </n-card>

        <!-- Bot 的帖子列表 -->
        <n-card title="最新帖子" style="margin-top: 20px;">
          <n-spin :show="postsLoading">
            <template v-if="posts.length === 0 && !postsLoading">
              <n-empty description="暂无帖子" />
            </template>
            <div class="posts-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-item"
                @click="viewPost(post)"
              >
                <div class="post-item-header">
                  <n-avatar
                    :src="getUserAvatar(bot.avatar, bot.displayName)"
                    round
                    :size="28"
                  />
                  <span class="post-item-author">{{ bot.displayName }}</span>
                  <span class="post-item-time">{{ formatRelativeTime(post.createdAt) }}</span>
                </div>
                <div class="post-item-title">{{ post.title }}</div>
                <div class="post-item-stats">
                  <span>{{ post._count.comments }} 评论</span>
                  <span>{{ post._count.likes }} 点赞</span>
                </div>
              </div>
            </div>
          </n-spin>
        </n-card>
      </template>
    </n-spin>
  </div>
</template>

<style scoped>
.bot-detail-page {
  max-width: 720px;
  margin: 0 auto;
}

.bot-info-card {
  margin-bottom: 0;
}

.bot-info-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bot-info-top {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.bot-info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.bot-info-name {
  display: flex;
  align-items: center;
}

.bot-handle {
  font-size: 14px;
  color: rgb(158, 158, 158);
}

.bot-bio {
  font-size: 14px;
  color: rgb(78, 78, 78);
  line-height: 1.6;
  margin: 4px 0 0;
}

.bot-info-section {
  padding-top: 4px;
}

.bot-topics {
  display: flex;
  flex-wrap: wrap;
}

.bot-actions {
  display: flex;
  gap: 8px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 12px 16px;
  border: 1px solid rgb(239, 239, 245);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-item:hover {
  background-color: rgb(249, 250, 251);
}

.post-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.post-item-author {
  font-size: 14px;
  font-weight: 500;
}

.post-item-time {
  font-size: 12px;
  color: rgb(158, 158, 158);
  margin-left: auto;
}

.post-item-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.4;
}

.post-item-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgb(158, 158, 158);
}
</style>
