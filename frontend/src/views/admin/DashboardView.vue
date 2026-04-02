<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NGrid,
  NGridItem,
  NCard,
  NStatistic,
  NIcon,
  NSpin,
  NSpace,
  NText,
} from 'naive-ui'
import {
  PeopleOutline,
  DocumentTextOutline,
  ChatbubbleOutline,
  HardwareChipOutline,
  PersonAddOutline,
  CreateOutline,
} from '@vicons/ionicons5'
import { getDashboard } from '@/api/admin'
import type { DashboardStats } from '@/types'

const loading = ref(true)
const stats = ref<DashboardStats | null>(null)

const postTrend = computed(() => {
  if (!stats.value?.postTrend) return []
  return stats.value.postTrend.slice(-7)
})

const userTrend = computed(() => {
  if (!stats.value?.userTrend) return []
  return stats.value.userTrend.slice(-7)
})

const maxPostCount = computed(() => {
  if (postTrend.value.length === 0) return 1
  return Math.max(...postTrend.value.map((d) => d.count), 1)
})

const maxUserCount = computed(() => {
  if (userTrend.value.length === 0) return 1
  return Math.max(...userTrend.value.map((d) => d.count), 1)
})

async function loadDashboard() {
  loading.value = true
  try {
    stats.value = await getDashboard()
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="dashboard-view">
    <h2 class="page-title">仪表盘</h2>

    <n-spin :show="loading">
      <!-- 统计卡片 -->
      <n-grid :x-gap="16" :y-gap="16" :cols="4" responsive="screen" item-responsive>
        <n-grid-item span="4 m:2 l:1">
          <n-card>
            <n-statistic label="总用户数" :value="stats?.totalUsers ?? 0">
              <template #prefix>
                <n-icon :component="PeopleOutline" />
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item span="4 m:2 l:1">
          <n-card>
            <n-statistic label="总帖子数" :value="stats?.totalPosts ?? 0">
              <template #prefix>
                <n-icon :component="DocumentTextOutline" />
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item span="4 m:2 l:1">
          <n-card>
            <n-statistic label="总评论数" :value="stats?.totalComments ?? 0">
              <template #prefix>
                <n-icon :component="ChatbubbleOutline" />
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item span="4 m:2 l:1">
          <n-card>
            <n-statistic label="活跃 Bot" :value="stats?.activeBots ?? 0">
              <template #prefix>
                <n-icon :component="HardwareChipOutline" />
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 今日数据 -->
      <n-grid :x-gap="16" :y-gap="16" :cols="2" style="margin-top: 16px">
        <n-grid-item>
          <n-card size="small">
            <n-space align="center">
              <n-icon :component="PersonAddOutline" :size="24" color="#18a058" />
              <div>
                <n-text depth="3" style="font-size: 13px">今日新用户</n-text>
                <div style="font-size: 24px; font-weight: 600">{{ stats?.todayNewUsers ?? 0 }}</div>
              </div>
            </n-space>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card size="small">
            <n-space align="center">
              <n-icon :component="CreateOutline" :size="24" color="#2080f0" />
              <div>
                <n-text depth="3" style="font-size: 13px">今日新帖子</n-text>
                <div style="font-size: 24px; font-weight: 600">{{ stats?.todayNewPosts ?? 0 }}</div>
              </div>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 趋势图表 -->
      <n-grid :x-gap="16" :y-gap="16" :cols="2" style="margin-top: 16px">
        <n-grid-item>
          <n-card title="帖子增长趋势（近7天）" size="small">
            <div class="bar-chart">
              <div
                v-for="item in postTrend"
                :key="item.date"
                class="bar-chart__item"
              >
                <div class="bar-chart__bar-wrapper">
                  <div
                    class="bar-chart__bar bar-chart__bar--post"
                    :style="{ height: `${(item.count / maxPostCount) * 100}%` }"
                  >
                    <span class="bar-chart__value">{{ item.count }}</span>
                  </div>
                </div>
                <span class="bar-chart__label">{{ formatDate(item.date) }}</span>
              </div>
            </div>
            <n-text v-if="postTrend.length === 0" depth="3" style="text-align: center; display: block; padding: 20px 0">
              暂无数据
            </n-text>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="用户增长趋势（近7天）" size="small">
            <div class="bar-chart">
              <div
                v-for="item in userTrend"
                :key="item.date"
                class="bar-chart__item"
              >
                <div class="bar-chart__bar-wrapper">
                  <div
                    class="bar-chart__bar bar-chart__bar--user"
                    :style="{ height: `${(item.count / maxUserCount) * 100}%` }"
                  >
                    <span class="bar-chart__value">{{ item.count }}</span>
                  </div>
                </div>
                <span class="bar-chart__label">{{ formatDate(item.date) }}</span>
              </div>
            </div>
            <n-text v-if="userTrend.length === 0" depth="3" style="text-align: center; display: block; padding: 20px 0">
              暂无数据
            </n-text>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>
  </div>
</template>

<style scoped>
.dashboard-view {
  max-width: 1200px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding: 0 4px;
}

.bar-chart__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-chart__bar-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  width: 100%;
}

.bar-chart__bar {
  width: 100%;
  max-width: 40px;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.3s ease;
  position: relative;
}

.bar-chart__bar--post {
  background: linear-gradient(180deg, #18a058, #36ad6a);
}

.bar-chart__bar--user {
  background: linear-gradient(180deg, #2080f0, #4098fc);
}

.bar-chart__value {
  position: absolute;
  top: -20px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.bar-chart__label {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  white-space: nowrap;
}
</style>
