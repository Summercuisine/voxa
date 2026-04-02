<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NAvatar,
  NTag,
  NEmpty,
  NSpin,
  NIcon,
  NPagination,
  NProgress,
  NTooltip,
} from 'naive-ui'
import { CalendarOutline, DocumentTextOutline, MailOutline } from '@vicons/ionicons5'
import { getUser, getUserPosts } from '@/api/users'
import { getMyLevel } from '@/api/gamification'
import { getMyBadges } from '@/api/badges'
import { useUserStore } from '@/stores/user'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { User, PostListItem, UserLevel, Badge } from '@/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const userId = computed(() => route.params.id as string)

// 用户状态
const user = ref<User | null>(null)
const loading = ref(false)

// 等级状态
const userLevel = ref<UserLevel | null>(null)

// 徽章状态
const badges = ref<Badge[]>([])

// 帖子状态
const posts = ref<PostListItem[]>([])
const postsLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalPosts = ref(0)
const pageSize = 20

// 是否是自己的主页
const isOwnProfile = computed(() => userStore.currentUser?.id === userId.value)

// 获取用户信息
async function fetchUser() {
  loading.value = true
  try {
    const res = await getUser(userId.value)
    user.value = res
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取用户信息失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

// 获取等级信息
async function fetchUserLevel() {
  try {
    const res = await getMyLevel()
    userLevel.value = res
  } catch {
    // 静默处理
  }
}

// 获取徽章
async function fetchBadges() {
  try {
    const res = await getMyBadges()
    badges.value = res
  } catch {
    // 静默处理
  }
}

// 获取用户帖子
async function fetchPosts() {
  postsLoading.value = true
  try {
    const res = await getUserPosts(userId.value, {
      page: currentPage.value,
      limit: pageSize,
    })
    posts.value = res.data
    totalPosts.value = res.meta.total
    totalPages.value = res.meta.totalPages
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取帖子列表失败'
    message.error(errorMsg)
  } finally {
    postsLoading.value = false
  }
}

// 分页
function handlePageChange(page: number) {
  currentPage.value = page
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转帖子详情
function goToPost(post: PostListItem) {
  router.push(`/post/${post.id}`)
}

// 跳转徽章页
function goToBadges() {
  router.push('/badges')
}

// 发私信
function goToMessage() {
  router.push(`/messages/${userId.value}`)
}

// 获取等级颜色
function getLevelColor(level: number): string {
  if (level >= 20) return '#e74c3c'
  if (level >= 15) return '#e67e22'
  if (level >= 10) return '#9b59b6'
  if (level >= 5) return '#3498db'
  return '#27ae60'
}

// 显示的徽章（最多 8 个）
const displayBadges = computed(() => badges.value.slice(0, 8))
const hasMoreBadges = computed(() => badges.value.length > 8)

onMounted(() => {
  fetchUser()
  fetchPosts()
  if (isOwnProfile.value) {
    fetchUserLevel()
    fetchBadges()
  }
})
</script>

<template>
  <div class="user-profile-view">
    <n-spin :show="loading">
      <template v-if="user">
        <!-- 用户信息卡片 -->
        <n-card class="user-card">
          <div class="user-card__content">
            <n-avatar
              :src="getUserAvatar(user.avatar, user.username)"
              :size="80"
              round
            />
            <div class="user-card__info">
              <div class="user-card__name-row">
                <h1 class="user-card__name">{{ user.username }}</h1>
                <n-tag
                  :bordered="false"
                  size="small"
                  :color="{ color: getLevelColor(user.level) + '20', textColor: getLevelColor(user.level) }"
                >
                  Lv{{ user.level }}
                </n-tag>
                <span v-if="user.title" class="user-card__title">{{ user.title }}</span>
              </div>
              <p v-if="user.bio" class="user-card__bio">{{ user.bio }}</p>

              <!-- 经验值进度条 -->
              <div v-if="isOwnProfile && userLevel" class="user-card__exp">
                <div class="user-card__exp-header">
                  <span class="user-card__exp-label">经验值</span>
                  <span class="user-card__exp-text">
                    {{ userLevel.experience }} / {{ userLevel.nextLevelConfig?.maxExp ?? userLevel.levelConfig.maxExp }}
                  </span>
                </div>
                <n-progress
                  type="line"
                  :percentage="userLevel.progress"
                  :color="getLevelColor(user.level)"
                  :show-indicator="false"
                  :height="8"
                  :border-radius="4"
                />
                <span class="user-card__exp-next">
                  距下一级还需 {{ userLevel.expToNext }} 经验
                </span>
              </div>

              <div class="user-card__meta">
                <span class="user-card__stat">
                  <n-icon :component="CalendarOutline" />
                  加入于 {{ formatRelativeTime(user.createdAt) }}
                </span>
                <span class="user-card__stat">
                  <n-icon :component="DocumentTextOutline" />
                  {{ totalPosts }} 篇帖子
                </span>
              </div>

              <!-- 操作按钮 -->
              <div class="user-card__actions">
                <n-button
                  v-if="!isOwnProfile"
                  size="small"
                  type="primary"
                  secondary
                  @click="goToMessage"
                >
                  <template #icon>
                    <n-icon :component="MailOutline" />
                  </template>
                  发私信
                </n-button>
              </div>
            </div>
          </div>

          <!-- 徽章展示区 -->
          <div v-if="isOwnProfile && displayBadges.length > 0" class="user-card__badges">
            <div class="user-card__badges-header">
              <span class="user-card__badges-title">徽章</span>
              <n-button v-if="hasMoreBadges" text size="small" @click="goToBadges">
                查看全部
              </n-button>
            </div>
            <div class="user-card__badges-list">
              <n-tooltip v-for="badge in displayBadges" :key="badge.id" trigger="hover">
                <template #trigger>
                  <span class="user-card__badge-item">{{ badge.icon }}</span>
                </template>
                {{ badge.name }}
              </n-tooltip>
            </div>
          </div>
        </n-card>

        <!-- 用户帖子列表 -->
        <div class="user-posts">
          <h2 class="user-posts__title">发布的帖子</h2>
          <n-spin :show="postsLoading">
            <n-empty v-if="!postsLoading && posts.length === 0" description="暂无帖子" />
            <div v-else class="post-cards">
              <n-card
                v-for="post in posts"
                :key="post.id"
                class="post-card"
                :class="{ 'post-card--pinned': post.isPinned }"
                hoverable
                @click="goToPost(post)"
              >
                <div class="post-card__header">
                  <div class="post-card__meta">
                    <span v-if="post.isPinned" class="post-card__pin" title="置顶">📌</span>
                    <span v-if="post.isLocked" class="post-card__lock" title="锁定">🔒</span>
                  </div>
                </div>

                <div class="post-card__title">
                  {{ post.title }}
                </div>

                <div v-if="post.tags?.length" class="post-card__tags">
                  <n-tag
                    v-for="tag in post.tags"
                    :key="tag.id"
                    size="tiny"
                    :bordered="false"
                    type="success"
                  >
                    {{ tag.name }}
                  </n-tag>
                </div>

                <div class="post-card__footer">
                  <span class="post-card__stat" title="点赞数">❤️ {{ post._count.likes }}</span>
                  <span class="post-card__stat" title="评论数">💬 {{ post._count.comments }}</span>
                  <span class="post-card__stat" title="浏览数">👁 {{ post.viewCount }}</span>
                  <span class="post-card__time">{{ formatRelativeTime(post.createdAt) }}</span>
                </div>
              </n-card>
            </div>
          </n-spin>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <n-pagination
            :page="currentPage"
            :page-count="totalPages"
            :page-size="pageSize"
            show-quick-jumper
            @update:page="handlePageChange"
          />
        </div>
      </template>
    </n-spin>
  </div>
</template>

<style scoped>
.user-profile-view {
  max-width: 900px;
  margin: 0 auto;
}

.user-card {
  margin-bottom: 24px;
}

.user-card__content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-card__info {
  flex: 1;
}

.user-card__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-card__name {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.user-card__title {
  font-size: 13px;
  color: #9b59b6;
  font-weight: 500;
}

.user-card__bio {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.user-card__exp {
  margin-bottom: 12px;
  max-width: 300px;
}

.user-card__exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.user-card__exp-label {
  font-size: 12px;
  color: #999;
}

.user-card__exp-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.user-card__exp-next {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  display: block;
}

.user-card__meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}

.user-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-card__actions {
  margin-top: 12px;
}

/* 徽章区 */
.user-card__badges {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.user-card__badges-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-card__badges-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.user-card__badges-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-card__badge-item {
  font-size: 28px;
  cursor: pointer;
  transition: transform 0.2s;
  display: inline-block;
}

.user-card__badge-item:hover {
  transform: scale(1.2);
}

.user-posts__title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.post-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  transform: translateY(-1px);
}

.post-card--pinned {
  border-left: 3px solid #18a058;
  background-color: rgba(24, 160, 88, 0.04);
}

.post-card__header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
}

.post-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-card__pin,
.post-card__lock {
  font-size: 14px;
}

.post-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.post-card__footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.post-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-card__time {
  margin-left: auto;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .user-card__content {
    flex-direction: column;
    text-align: center;
  }

  .user-card__name-row {
    justify-content: center;
  }

  .user-card__meta {
    justify-content: center;
  }

  .user-card__exp {
    max-width: 100%;
  }

  .user-card__name {
    font-size: 20px;
  }

  .post-card__title {
    font-size: 16px;
  }
}
</style>
