<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import {
  NCard,
  NDataTable,
  NInput,
  NButton,
  NSelect,
  NSpace,
  NAvatar,
  NTag,
  NPopconfirm,
  NPagination,
  NSpin,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { SearchOutline, PersonOutline } from '@vicons/ionicons5'
import { getUsers, updateUser, deleteUser } from '@/api/admin'
import { getUserAvatar } from '@/utils'
import type { AdminUser, PaginatedResponse } from '@/types'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const roleFilter = ref<string | null>(null)

const roleOptions = [
  { label: '全部', value: '' },
  { label: '用户', value: 'USER' },
  { label: '管理员', value: 'ADMIN' },
]

const columns: DataTableColumns<AdminUser> = [
  {
    title: '头像',
    key: 'avatar',
    width: 60,
    render(row) {
      return h(NAvatar, {
        src: getUserAvatar(row.avatar, row.username),
        round: true,
        size: 32,
      })
    },
  },
  {
    title: '用户名',
    key: 'username',
    ellipsis: { tooltip: true },
    render(row) {
      return h(
        'a',
        {
          style: 'color: #18a058; cursor: pointer',
          onClick: () => router.push(`/user/${row.id}`),
        },
        row.username
      )
    },
  },
  {
    title: '邮箱',
    key: 'email',
    ellipsis: { tooltip: true },
  },
  {
    title: '角色',
    key: 'role',
    width: 140,
    render(row) {
      return h(
        NSelect,
        {
          value: row.role,
          options: [
            { label: '用户', value: 'USER' },
            { label: '管理员', value: 'ADMIN' },
          ],
          size: 'small',
          style: 'width: 100px',
          onUpdateValue: (val: string) => handleUpdateRole(row, val),
        }
      )
    },
  },
  {
    title: 'Bot',
    key: 'isBot',
    width: 70,
    render(row) {
      return row.isBot ? h(NTag, { type: 'info', size: 'small' }, { default: () => 'Bot' }) : null
    },
  },
  {
    title: '帖子数',
    key: 'posts',
    width: 80,
    render(row) {
      return row._count?.posts ?? 0
    },
  },
  {
    title: '注册时间',
    key: 'createdAt',
    width: 120,
    render(row) {
      return new Date(row.createdAt).toLocaleDateString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row) {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteUser(row.id),
        },
        {
          trigger: () =>
            h(
              NButton,
              { type: 'error', size: 'small', quaternary: true },
              { default: () => '删除' }
            ),
          default: () => '确定删除该用户？',
        }
      )
    },
  },
]

async function loadUsers() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      limit: pageSize.value,
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    if (roleFilter.value) {
      params.role = roleFilter.value
    }
    const res = await getUsers(params as Parameters<typeof getUsers>[0])
    users.value = res.data
    total.value = res.meta.total
  } catch {
    message.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

async function handleUpdateRole(user: AdminUser, newRole: string) {
  try {
    await updateUser(user.id, { role: newRole })
    message.success('角色已更新')
    loadUsers()
  } catch {
    message.error('更新角色失败')
  }
}

async function handleDeleteUser(id: string) {
  try {
    await deleteUser(id)
    message.success('用户已删除')
    loadUsers()
  } catch {
    message.error('删除用户失败')
  }
}

function handleSearch() {
  page.value = 1
  loadUsers()
}

function handlePageChange(p: number) {
  page.value = p
  loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="users-view">
    <h2 class="page-title">用户管理</h2>

    <n-card>
      <div class="toolbar">
        <n-space>
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索用户名或邮箱..."
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
            v-model:value="roleFilter"
            :options="roleOptions"
            placeholder="角色筛选"
            clearable
            style="width: 120px"
            @update:value="() => { page = 1; loadUsers() }"
          />
        </n-space>
      </div>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="users"
          :row-key="(row: AdminUser) => row.id"
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
.users-view {
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
</style>
