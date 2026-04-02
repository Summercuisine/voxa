<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NInput,
  NPagination,
  NAvatar,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NTabs,
  NTabPane,
  NIcon,
  NGrid,
  NGridItem,
} from 'naive-ui'
import { SearchOutline, CreateOutline } from '@vicons/ionicons5'
import { getPosts } from '@/api/posts'
import { getCategories } from '@/api/categories'
import { useUserStore } from '@/stores/user'
import { formatRelativeTime, truncateText, getUserAvatar } from '@/utils'
import type { PostListItem, Category } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 状态
const posts = ref<PostListItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const searchQuery = ref('')
const activeCategory = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalPosts = ref(0)
const pageSize = 20

// 获取帖子列表
async function fetchPosts() {
  loading.value = true
  try {
    const res = await getPosts({
      page: currentPage.value,
      limit: pageSize,
      categoryId: activeCategory.value ?? undefined,
      search: searchQuery.value || undefined,
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

// 获取分类列表
async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res
  } catch {
    // 静默处理分类加载失败
  }
}

// 搜索
function handleSearch() {
  currentPage.value = 1
  fetchPosts()
}

// 切换分类
function handleCategoryChange(id: string | number) {
  if (id === 'all') {
    activeCategory.value = null
  } else {
    activeCategory.value = String(id)
  }
  currentPage.value = 1
  fetchPosts()
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

// 跳转发帖
function goToCreatePost() {
  router.push('/post/create')
}

// 跳转用户主页
function goToUser(userId: string) {
  router.push(`/user/${userId}`)
}

// 跳转分类页
function goToCategory(categoryId: string) {
  router.push(`/category/${categoryId}`)
}

onMounted(() => {
  fetchCategories()
  fetchPosts()
})
</script>

<template>
  <div class="home-view">
    <!-- 顶部操作栏 -->
    <div class="home-header">
      <div class="search-box">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索帖子..."
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
        <n-button type="primary" @click="handleSearch">搜索</n-button>
      </div>
      <n-button v-if="userStore.isLoggedIn" type="primary" @click="goToCreatePost">
        <template #icon>
          <n-icon :component="CreateOutline" />
        </template>
        发帖
      </n-button>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs">
      <n-tabs
        type="segment"
        :value="activeCategory ?? 'all'"
        @update:value="handleCategoryChange"
      >
        <n-tab-pane name="all" tab="全部" />
        <n-tab-pane
          v-for="cat in categories"
          :key="cat.id"
          :name="cat.id"
          :tab="cat.name"
        />
      </n-tabs>
    </div>

    <!-- 帖子列表 -->
    <div class="post-list">
      <n-spin :show="loading">
        <n-empty v-if="!loading && posts.length === 0" description="暂无帖子" />
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
                <n-tag
                  v-if="post.category"
                  size="small"
                  :bordered="false"
                  type="info"
                  class="post-card__category"
                  @click.stop="goToCategory(post.category.id)"
                >
                  {{ post.category.name }}
                </n-tag>
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
              <span class="post-card__stat" title="评论数">
                💬 {{ post._count.comments }}
              </span>
              <span class="post-card__stat" title="浏览数">
                👁 {{ post.viewCount }}
              </span>
              <span class="post-card__time">
                {{ formatRelativeTime(post.createdAt) }}
              </span>
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
  </div>
</template>

<style scoped>
.home-view {
  max-width: 900px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  max-width: 480px;
}

.category-tabs {
  margin-bottom: 16px;
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

/* 响应式 */
@media (max-width: 640px) {
  .home-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .post-card__title {
    font-size: 16px;
  }
}
</style>
