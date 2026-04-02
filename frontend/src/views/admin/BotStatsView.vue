<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { NCard, NDataTable, NTag, NSpin } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getBotStats } from '@/api/admin'
import type { BotStat } from '@/types'

const message = useMessage()
const loading = ref(false)
const bots = ref<BotStat[]>([])

const columns: DataTableColumns<BotStat> = [
  {
    title: '名称',
    key: 'displayName',
    render(row) {
      return h('div', [
        h('div', { style: 'font-weight: 500' }, row.displayName),
        h('div', { style: 'font-size: 12px; color: #999' }, `@${row.botName}`),
      ])
    },
  },
  {
    title: '状态',
    key: 'isActive',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.isActive ? 'success' : 'default',
          size: 'small',
        },
        { default: () => (row.isActive ? '活跃' : '停用') }
      )
    },
  },
  {
    title: '发帖数',
    key: 'postCount',
    width: 100,
  },
  {
    title: '评论数',
    key: 'commentCount',
    width: 100,
  },
]

async function loadBotStats() {
  loading.value = true
  try {
    bots.value = await getBotStats()
  } catch {
    message.error('加载 Bot 统计失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBotStats()
})
</script>

<template>
  <div class="bot-stats-view">
    <h2 class="page-title">Bot 统计</h2>

    <n-card>
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="bots"
          :row-key="(row: BotStat) => row.botId"
          :bordered="false"
          striped
        />
      </n-spin>
    </n-card>
  </div>
</template>

<style scoped>
.bot-stats-view {
  max-width: 1200px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
