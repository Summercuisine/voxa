<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NDataTable,
  NInput,
  NButton,
  NSelect,
  NSpace,
  NTag,
  NPopconfirm,
  NPagination,
  NSpin,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { SearchOutline, EyeOutline, PinOutline, LockClosedOutline, TrashOutline } from '@vicons/ionicons5'
import { getPosts, deletePost } from '@/api/admin'
import type { PostListItem, PaginatedResponse } from '@/types'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const posts = ref<PostListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '置顶', value: 'pinned' },
  { label: '锁定', value: 'locked' },
]

const columns: DataTableColumns<PostListItem> = [
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render(row) {
      return h(
        'a',
        {
          style: 'color: #18a058; cursor: pointer',
          onClick: () => router.push(`/post/${row.id}`),
        },
        row.title
      )
    },
  },
  {
    title: '作者',
    key: 'author',
    width: 100,
    render(row) {
      return row.author?.username ?? '-'
    },
  },
  {
    title: '分类',
    key: 'category',
    width: 100,
    render(row) {
      return row.category?.name ?? '-'
    },
  },
  {
    title: '浏览数',
    key: 'viewCount',
    width: 80,
  },
  {
    title: '评论数',
    key: 'comments',
    width: 80,
    render(row) {
      return row._count?.comments ?? 0
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      const tags: ReturnType<typeof h>[] = []
      if (row.isPinned) {
        tags.push(h(NTag, { type: 'warning', size: 'small', bordered: false }, { default: () => '置顶' }))
      }
      if (row.isLocked) {
        tags.push(h(NTag, { type: 'error', size: 'small', bordered: false }, { default: () => '锁定' }))
      }
      return h(NSpace, { size: 4, wrap: false }, { default: () => tags })
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 120,
    render(row) {
      return new Date(row.createdAt).toLocaleDateString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return h(NSpace, { size: 4 }, {
        default: () => [
          h(
            NButton,
            { size: 'small', quaternary: true, onClick: () => router.push(`/post/${row.id}`) },
            {
              icon: () => h('span', { class: 'action-icon' }, '查看'),
            }
          ),
          h(
            NButton,
            { size: 'small', quaternary: true, type: row.isPinned ? 'warning' : 'default', onClick: () => handleTogglePin(row) },
            {
              icon: () => h('span', { class: 'action-icon' }, row.isPinned ? '取消置顶' : '置顶'),
            }
          ),
          h(
            NButton,
            { size: 'small', quaternary: true, type: row.isLocked ? 'warning' : 'default', onClick: () => handleToggleLock(row) },
            {
              icon: () => h('span', { class: 'action-icon' }, row.isLocked ? '解锁' : '锁定'),
            }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () =>
                h(
                  NButton,
                  { size: 'small', quaternary: true, type: 'error' },
                  { default: () => '删除' }
                ),
              default: () => '确定删除该帖子？',
            }
          ),
        ],
      })
    },
  },
]

async function loadPosts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      limit: pageSize.value,
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    const res = await getPosts(params as Parameters<typeof getPosts>[0])
    posts.value = (res as unknown as PaginatedResponse<PostListItem>).data
    total.value = (res as unknown as PaginatedResponse<PostListItem>).meta.total
  } catch {
    message.error('加载帖子列表失败')
  } finally {
    loading.value = false
  }
}

async function handleTogglePin(post: PostListItem) {
  // Toggle pin status - in real app this would call an API
  message.info(post.isPinned ? `已取消置顶: ${post.title}` : `已置顶: ${post.title}`)
}

async function handleToggleLock(post: PostListItem) {
  message.info(post.isLocked ? `已解锁: ${post.title}` : `已锁定: ${post.title}`)
}

async function handleDelete(id: string) {
  try {
    await deletePost(id)
    message.success('帖子已删除')
    loadPosts()
  } catch {
    message.error('删除帖子失败')
  }
}

function handleSearch() {
  page.value = 1
  loadPosts()
}

function handlePageChange(p: number) {
  page.value = p
  loadPosts()
}

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="posts-view">
    <h2 class="page-title">帖子管理</h2>

    <n-card>
      <div class="toolbar">
        <n-space>
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索帖子标题..."
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
          <n-button type="primary" @click="handleSearch">搜索</n-button>
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="状态筛选"
            clearable
            style="width: 120px"
            @update:value="() => { page = 1; loadPosts() }"
          />
        </n-space>
      </div>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="posts"
          :row-key="(row: PostListItem) => row.id"
          :bordered="false"
          striped
        />
      </n-spin>

      <div class="pagination-wrapper">
        <n-pagination
          v-model:page="page"
          :page-size="pageSize"
          :item-count="total"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.posts-view {
  max-width: 1200px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.action-icon {
  font-size: 12px;
}
</style>
