<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NEmpty,
  NSpin,
  NTag,
  NAvatar,
  NPagination,
  NIcon,
  NButton,
} from 'naive-ui'
import { EyeOutline, ChatbubbleOutline, HeartOutline } from '@vicons/ionicons5'
import { getMyBookmarks } from '@/api/likes'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { PostListItem } from '@/types'

const router = useRouter()
const message = useMessage()

const bookmarks = ref<PostListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

async function fetchBookmarks() {
  loading.value = true
  try {
    const res = await getMyBookmarks({ page: currentPage.value, limit: pageSize })
    bookmarks.value = res.data as PostListItem[]
    total.value = res.meta.total
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取收藏列表失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

function goToPost(post: PostListItem) {
  router.push(`/post/${post.id}`)
}

function goToUser(userId: string) {
  router.push(`/user/${userId}`)
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await fetchBookmarks()
}

onMounted(() => {
  fetchBookmarks()
})
</script>

<template>
  <div class="bookmarks-view">
    <n-card title="我的收藏">
      <n-spin :show="loading">
        <n-empty
          v-if="!loading && bookmarks.length === 0"
          description="暂无收藏的帖子"
        >
          <template #extra>
            <n-button type="primary" @click="router.push('/')">
              浏览帖子
            </n-button>
          </template>
        </n-empty>

        <div v-else class="bookmarks-list">
          <div
            v-for="post in bookmarks"
            :key="post.id"
            class="bookmark-card"
            @click="goToPost(post)"
          >
            <div class="bookmark-card__header">
              <h3 class="bookmark-card__title">{{ post.title }}</h3>
              <n-tag v-if="post.category" type="info" size="small" :bordered="false">
                {{ post.category.name }}
              </n-tag>
            </div>
            <div class="bookmark-card__meta">
              <div class="bookmark-card__author" @click.stop="goToUser(post.author.id)">
                <n-avatar
                  :src="getUserAvatar(post.author?.avatar, post.author?.username)"
                  :size="24"
                  round
                />
                <span>{{ post.author?.username || '匿名用户' }}</span>
              </div>
              <span class="bookmark-card__time">{{ formatRelativeTime(post.createdAt) }}</span>
            </div>
            <div class="bookmark-card__tags">
              <n-tag
                v-for="tag in post.tags"
                :key="tag.id"
                type="success"
                size="small"
                :bordered="false"
              >
                {{ tag.name }}
              </n-tag>
            </div>
            <div class="bookmark-card__stats">
              <span class="bookmark-card__stat">
                <n-icon :component="EyeOutline" />
                {{ post.viewCount }}
              </span>
              <span class="bookmark-card__stat">
                <n-icon :component="HeartOutline" />
                {{ post._count.likes }}
              </span>
              <span class="bookmark-card__stat">
                <n-icon :component="ChatbubbleOutline" />
                {{ post._count.comments }}
              </span>
            </div>
          </div>
        </div>
      </n-spin>

      <div v-if="total > pageSize" class="bookmarks-pagination">
        <n-pagination
          :page="currentPage"
          :page-size="pageSize"
          :item-count="total"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.bookmarks-view {
  max-width: 800px;
  margin: 0 auto;
}

.bookmarks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bookmark-card {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.2s;
}

.bookmark-card:hover {
  background: #f5f5f5;
}

.bookmark-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.bookmark-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bookmark-card__author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.bookmark-card__author:hover {
  color: #18a058;
}

.bookmark-card__time {
  font-size: 12px;
  color: #999;
}

.bookmark-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.bookmark-card__stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.bookmark-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bookmarks-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
