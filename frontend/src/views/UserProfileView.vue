<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NAvatar,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NIcon,
  NPagination,
  NStatistic,
} from 'naive-ui'
import { CalendarOutline, DocumentTextOutline } from '@vicons/ionicons5'
import { getUser, getUserPosts } from '@/api/users'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { User, PostListItem } from '@/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const userId = computed(() => route.params.id as string)

// 用户状态
const user = ref<User | null>(null)
const loading = ref(false)

// 帖子状态
const posts = ref<PostListItem[]>([])
const postsLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalPosts = ref(0)
const pageSize = 20

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

onMounted(() => {
  fetchUser()
  fetchPosts()
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
              <h1 class="user-card__name">{{ user.username }}</h1>
              <p v-if="user.bio" class="user-card__bio">{{ user.bio }}</p>
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

.user-card__name {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.user-card__bio {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.6;
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

  .user-card__meta {
    justify-content: center;
  }

  .user-card__name {
    font-size: 20px;
  }

  .post-card__title {
    font-size: 16px;
  }
}
</style>
