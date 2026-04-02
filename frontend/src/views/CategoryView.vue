<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NInput,
  NAvatar,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NIcon,
  NPagination,
} from 'naive-ui'
import { getCategory } from '@/api/categories'
import { getPosts } from '@/api/posts'
import { formatRelativeTime, truncateText, getUserAvatar } from '@/utils'
import type { Category, PostListItem } from '@/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const categoryId = computed(() => route.params.id as string)

// 状态
const category = ref<Category | null>(null)
const posts = ref<PostListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalPosts = ref(0)
const pageSize = 20

// 获取分类详情
async function fetchCategory() {
  try {
    const res = await getCategory(categoryId.value)
    category.value = res
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取分类信息失败'
    message.error(errorMsg)
  }
}

// 获取该分类下的帖子
async function fetchPosts() {
  loading.value = true
  try {
    const res = await getPosts({
      page: currentPage.value,
      limit: pageSize,
      categoryId: categoryId.value,
    })
    posts.value = res.data
    totalPosts.value = res.meta.total
    totalPages.value = res.meta.totalPages
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取帖子列表失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
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

// 跳转用户主页
function goToUser(userId: string) {
  router.push(`/user/${userId}`)
}

onMounted(() => {
  fetchCategory()
  fetchPosts()
})
</script>

<template>
  <div class="category-view">
    <n-spin :show="loading && !category">
      <template v-if="category">
        <!-- 分类信息 -->
        <div class="category-header">
          <h1 class="category-header__name">{{ category.name }}</h1>
          <p v-if="category.description" class="category-header__desc">
            {{ category.description }}
          </p>
          <span class="category-header__count">{{ totalPosts }} 个帖子</span>
        </div>

        <!-- 帖子列表 -->
        <div class="post-list">
          <n-spin :show="loading">
            <n-empty v-if="!loading && posts.length === 0" description="该分类下暂无帖子" />
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
                  <div class="post-card__author" @click.stop="goToUser(post.author.id)">
                    <n-avatar
                      :src="getUserAvatar(post.author?.avatar, post.author?.username)"
                      :size="32"
                      round
                    />
                    <span class="post-card__username">{{ post.author?.username || '匿名用户' }}</span>
                  </div>
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
.category-view {
  max-width: 900px;
  margin: 0 auto;
}

.category-header {
  margin-bottom: 24px;
}

.category-header__name {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.category-header__desc {
  font-size: 15px;
  color: #666;
  margin: 0 0 8px 0;
}

.category-header__count {
  font-size: 13px;
  color: #999;
}

.post-list {
  min-height: 200px;
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-card__author {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.post-card__author:hover .post-card__username {
  color: #18a058;
}

.post-card__username {
  font-size: 14px;
  color: #666;
  transition: color 0.2s;
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
  .category-header__name {
    font-size: 22px;
  }

  .post-card__title {
    font-size: 16px;
  }
}
</style>
