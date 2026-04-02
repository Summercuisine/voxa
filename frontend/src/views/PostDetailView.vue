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
  NEmpty,
  NSpin,
  NIcon,
  NButtonGroup,
  NDivider,
  NPagination,
  NSkeleton,
  NTooltip,
} from 'naive-ui'
import {
  HeartOutline,
  Heart,
  StarOutline,
  Star,
  ShareSocialOutline,
  ArrowBackOutline,
  ChatbubbleOutline,
  EyeOutline,
  CreateOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { getPost, deletePost } from '@/api/posts'
import { getLikeStatus, togglePostLike, toggleBookmark } from '@/api/likes'
import { getComments, createComment } from '@/api/comments'
import { useUserStore } from '@/stores/user'
import { formatRelativeTime, getUserAvatar } from '@/utils'
import type { Post, Comment } from '@/types'
import CommentItem from '@/components/post/CommentItem'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const postId = computed(() => route.params.id as string)

// 帖子状态
const post = ref<Post | null>(null)
const loading = ref(false)
const isLiked = ref(false)
const isFavorited = ref(false)
const likeCount = ref(0)
const bookmarkCount = ref(0)

// 评论状态
const comments = ref<Comment[]>([])
const commentsLoading = ref(false)
const newComment = ref('')
const replyTo = ref<Comment | null>(null)
const submittingComment = ref(false)
const commentPage = ref(1)
const commentTotalPages = ref(1)
const commentPageSize = 20

// 是否可以编辑/删除
const canEdit = computed(() => {
  if (!userStore.isLoggedIn || !post.value) return false
  return post.value.authorId === userStore.currentUser?.id || userStore.isAdmin
})

// 获取等级颜色
function getLevelColor(level: number): string {
  if (level >= 20) return '#e74c3c'
  if (level >= 15) return '#e67e22'
  if (level >= 10) return '#9b59b6'
  if (level >= 5) return '#3498db'
  return '#27ae60'
}

// 并行获取帖子详情、点赞状态、评论
async function fetchAllData() {
  loading.value = true
  commentsLoading.value = true
  try {
    const [postRes, likeRes, commentsRes] = await Promise.all([
      getPost(postId.value),
      userStore.isLoggedIn
        ? getLikeStatus(postId.value).catch(() => null)
        : Promise.resolve(null),
      getComments(postId.value, { page: commentPage.value, limit: commentPageSize }),
    ])

    post.value = postRes
    likeCount.value = postRes._count.likes
    bookmarkCount.value = postRes._count.bookmarks

    if (likeRes) {
      isLiked.value = likeRes.isLiked
      isFavorited.value = likeRes.isBookmarked
      likeCount.value = likeRes.likeCount
      bookmarkCount.value = likeRes.bookmarkCount
    }

    comments.value = buildCommentTree(commentsRes.data)
    commentTotalPages.value = commentsRes.meta.totalPages
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取帖子详情失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
    commentsLoading.value = false
  }
}

// 构建评论树（嵌套回复）
function buildCommentTree(flatComments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  for (const comment of flatComments) {
    commentMap.set(comment.id, { ...comment, replies: [] })
  }

  for (const comment of flatComments) {
    const node = commentMap.get(comment.id)
    if (node) {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(node)
        }
      } else {
        rootComments.push(node)
      }
    }
  }

  return rootComments
}

// 点赞
async function toggleLike() {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后操作')
    return
  }
  try {
    await togglePostLike(postId.value)
    isLiked.value = !isLiked.value
    likeCount.value += isLiked.value ? 1 : -1
    message.success(isLiked.value ? '已点赞' : '已取消点赞')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '操作失败'
    message.error(errorMsg)
  }
}

// 收藏
async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后操作')
    return
  }
  try {
    await toggleBookmark(postId.value)
    isFavorited.value = !isFavorited.value
    bookmarkCount.value += isFavorited.value ? 1 : -1
    message.success(isFavorited.value ? '收藏成功' : '已取消收藏')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '操作失败'
    message.error(errorMsg)
  }
}

// 分享
async function handleShare() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    message.success('链接已复制到剪贴板')
  } catch {
    message.error('复制链接失败')
  }
}

// 编辑帖子
function handleEdit() {
  router.push(`/post/${postId.value}/edit`)
}

// 删除帖子
async function handleDelete() {
  try {
    await deletePost(postId.value)
    message.success('帖子已删除')
    router.push('/')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '删除失败'
    message.error(errorMsg)
  }
}

// 回复评论
function handleReply(comment: Comment) {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后评论')
    return
  }
  replyTo.value = comment
}

// 取消回复
function cancelReply() {
  replyTo.value = null
}

// 提交评论
async function handleSubmitComment() {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录后评论')
    return
  }
  if (!newComment.value.trim()) {
    message.warning('请输入评论内容')
    return
  }

  submittingComment.value = true
  try {
    await createComment(postId.value, {
      content: newComment.value.trim(),
      parentId: replyTo.value?.id,
    })
    message.success('评论成功')
    newComment.value = ''
    replyTo.value = null
    // 重新加载评论
    const res = await getComments(postId.value, { page: commentPage.value, limit: commentPageSize })
    comments.value = buildCommentTree(res.data)
    commentTotalPages.value = res.meta.totalPages
    if (post.value) post.value._count.comments++
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '评论失败'
    message.error(errorMsg)
  } finally {
    submittingComment.value = false
  }
}

// 评论分页
function handleCommentPageChange(page: number) {
  commentPage.value = page
  commentsLoading.value = true
  getComments(postId.value, { page, limit: commentPageSize })
    .then((res) => {
      comments.value = buildCommentTree(res.data)
      commentTotalPages.value = res.meta.totalPages
    })
    .catch(() => {
      message.error('获取评论失败')
    })
    .finally(() => {
      commentsLoading.value = false
    })
}

// 返回
function goBack() {
  router.back()
}

// 跳转用户主页
function goToUser(userId: string) {
  router.push(`/user/${userId}`)
}

onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div class="post-detail-view">
    <n-spin :show="loading">
      <!-- 骨架屏 -->
      <template v-if="loading">
        <div class="post-detail__back">
          <n-skeleton text style="width: 60px" />
        </div>
        <n-skeleton text style="width: 70%; height: 32px; margin-bottom: 16px" />
        <div class="post-detail__meta">
          <div class="post-detail__author">
            <n-skeleton circle size="medium" />
            <div>
              <n-skeleton text style="width: 100px" />
              <n-skeleton text style="width: 80px" />
            </div>
          </div>
        </div>
        <n-skeleton text :repeat="8" style="margin-bottom: 16px" />
      </template>

      <template v-else-if="post">
        <!-- 返回按钮 -->
        <div class="post-detail__back">
          <n-button text @click="goBack">
            <template #icon>
              <n-icon :component="ArrowBackOutline" />
            </template>
            返回
          </n-button>
        </div>

        <!-- 帖子标题和操作 -->
        <div class="post-detail__title-row">
          <h1 class="post-detail__title">{{ post.title }}</h1>
          <div v-if="canEdit" class="post-detail__edit-actions">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button text size="small" @click="handleEdit">
                  <template #icon>
                    <n-icon :component="CreateOutline" />
                  </template>
                </n-button>
              </template>
              编辑
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button text size="small" type="error" @click="handleDelete">
                  <template #icon>
                    <n-icon :component="TrashOutline" />
                  </template>
                </n-button>
              </template>
              删除
            </n-tooltip>
          </div>
        </div>

        <!-- 作者信息 -->
        <div class="post-detail__meta">
          <div class="post-detail__author" @click="goToUser(post.author.id)">
            <n-avatar
              :src="getUserAvatar(post.author?.avatar, post.author?.username)"
              :size="40"
              round
            />
            <div class="post-detail__author-info">
              <div class="post-detail__author-name-row">
                <span class="post-detail__username">{{ post.author?.username || '匿名用户' }}</span>
                <n-tag
                  :bordered="false"
                  size="small"
                  :color="{ color: getLevelColor(post.author?.level ?? 1) + '20', textColor: getLevelColor(post.author?.level ?? 1) }"
                >
                  Lv{{ post.author?.level ?? 1 }}
                </n-tag>
              </div>
              <span class="post-detail__time">{{ formatRelativeTime(post.createdAt) }}</span>
            </div>
          </div>
          <div class="post-detail__stats">
            <span class="post-detail__stat">
              <n-icon :component="EyeOutline" />
              {{ post.viewCount }}
            </span>
            <span class="post-detail__stat">
              <n-icon :component="ChatbubbleOutline" />
              {{ post._count.comments }}
            </span>
            <span class="post-detail__stat">
              <n-icon :component="HeartOutline" />
              {{ post._count.likes }}
            </span>
          </div>
        </div>

        <!-- 分类和标签 -->
        <div class="post-detail__tags">
          <n-tag v-if="post.category" type="info" :bordered="false">
            {{ post.category.name }}
          </n-tag>
          <n-tag
            v-for="tag in post.tags"
            :key="tag.id"
            type="success"
            :bordered="false"
          >
            {{ tag.name }}
          </n-tag>
        </div>

        <!-- 帖子内容 - Markdown 渲染 -->
        <n-card class="post-detail__content">
          <MdPreview :model-value="post.content" language="zh-CN" />
        </n-card>

        <!-- 操作栏 -->
        <div class="post-detail__actions">
          <n-button-group>
            <n-button
              :type="isLiked ? 'error' : 'default'"
              @click="toggleLike"
            >
              <template #icon>
                <n-icon :component="isLiked ? Heart : HeartOutline" />
              </template>
              {{ likeCount }}
            </n-button>
            <n-button
              :type="isFavorited ? 'warning' : 'default'"
              @click="toggleFavorite"
            >
              <template #icon>
                <n-icon :component="isFavorited ? Star : StarOutline" />
              </template>
              {{ bookmarkCount }}
            </n-button>
            <n-button @click="handleShare">
              <template #icon>
                <n-icon :component="ShareSocialOutline" />
              </template>
              分享
            </n-button>
          </n-button-group>
        </div>

        <n-divider />

        <!-- 评论区 -->
        <div class="comments-section">
          <h3 class="comments-section__title">评论 ({{ post._count.comments }})</h3>

          <!-- 评论输入 -->
          <div class="comment-input">
            <template v-if="userStore.isLoggedIn">
              <div v-if="replyTo" class="comment-input__reply">
                <span>回复 @{{ replyTo.author?.username || '匿名用户' }}</span>
                <n-button text size="tiny" @click="cancelReply">取消</n-button>
              </div>
              <n-input
                v-model:value="newComment"
                type="textarea"
                placeholder="写下你的评论..."
                :rows="3"
                :disabled="post.isLocked"
              />
              <div class="comment-input__actions">
                <span v-if="post.isLocked" class="comment-input__locked">帖子已锁定，无法评论</span>
                <n-button
                  v-else
                  type="primary"
                  :loading="submittingComment"
                  :disabled="!newComment.trim()"
                  @click="handleSubmitComment"
                >
                  发表评论
                </n-button>
              </div>
            </template>
            <div v-else class="comment-input__login">
              <n-button text @click="router.push('/login')">请先登录后评论</n-button>
            </div>
          </div>

          <!-- 评论列表 -->
          <n-spin :show="commentsLoading">
            <n-empty v-if="!commentsLoading && comments.length === 0" description="暂无评论" />
            <div v-else class="comment-list">
              <CommentItem
                v-for="comment in comments"
                :key="comment.id"
                :comment="comment"
                :depth="0"
                @reply="handleReply"
                @go-user="goToUser"
              />
            </div>
          </n-spin>

          <!-- 评论分页 -->
          <div v-if="commentTotalPages > 1" class="comment-pagination">
            <n-pagination
              :page="commentPage"
              :page-count="commentTotalPages"
              :page-size="commentPageSize"
              @update:page="handleCommentPageChange"
            />
          </div>
        </div>
      </template>
    </n-spin>
  </div>
</template>

<style scoped>
.post-detail-view {
  max-width: 900px;
  margin: 0 auto;
}

.post-detail__back {
  margin-bottom: 16px;
}

.post-detail__title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.post-detail__title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.post-detail__edit-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.post-detail__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.post-detail__author {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.post-detail__author:hover .post-detail__username {
  color: #18a058;
}

.post-detail__author-info {
  display: flex;
  flex-direction: column;
}

.post-detail__author-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-detail__username {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  transition: color 0.2s;
}

.post-detail__time {
  font-size: 13px;
  color: #999;
}

.post-detail__stats {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 14px;
}

.post-detail__stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.post-detail__content {
  margin-bottom: 16px;
}

.post-detail__actions {
  display: flex;
  justify-content: flex-start;
}

/* 评论区 */
.comments-section {
  margin-top: 8px;
}

.comments-section__title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.comment-input {
  margin-bottom: 24px;
}

.comment-input__reply {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.comment-input__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.comment-input__locked {
  font-size: 13px;
  color: #999;
}

.comment-input__login {
  text-align: center;
  padding: 24px;
  color: #999;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式 */
@media (max-width: 640px) {
  .post-detail__title {
    font-size: 22px;
  }

  .post-detail__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-item--depth-1,
  .comment-item--depth-2,
  .comment-item--depth-3,
  .comment-item--depth-4 {
    margin-left: 16px;
  }
}
</style>

<style>
.comment-item {
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: background 0.2s;
}

.comment-item:hover {
  background: #f5f5f5;
}

.comment-item--depth-1 {
  margin-left: 32px;
}

.comment-item--depth-2 {
  margin-left: 64px;
}

.comment-item--depth-3 {
  margin-left: 96px;
}

.comment-item--depth-4 {
  margin-left: 128px;
}

.comment-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-item__author {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.comment-item__author:hover .comment-item__username {
  color: #18a058;
}

.comment-item__username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: color 0.2s;
}

.comment-item__time {
  font-size: 12px;
  color: #999;
}

.comment-item__content {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 8px;
  word-break: break-word;
}

.comment-item__actions {
  display: flex;
  gap: 12px;
}

.comment-item__reply-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.comment-item__reply-btn:hover {
  color: #18a058;
}

/* 响应式 */
@media (max-width: 640px) {
  .comment-item--depth-1,
  .comment-item--depth-2,
  .comment-item--depth-3,
  .comment-item--depth-4 {
    margin-left: 16px;
  }
}
</style>
