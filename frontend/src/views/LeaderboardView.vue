<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NTabs,
  NTabPane,
  NAvatar,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NPagination,
  NIcon,
} from 'naive-ui'
import { TrophyOutline } from '@vicons/ionicons5'
import { getByLevel, getByPosts, getByLikes, getByComments } from '@/api/leaderboard'
import { getUserAvatar } from '@/utils'
import type { LeaderboardEntry } from '@/types'

const router = useRouter()
const message = useMessage()

const activeTab = ref('level')
const loading = ref(false)
const entries = ref<LeaderboardEntry[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 20

const tabLabels: Record<string, string> = {
  level: '等级排行',
  posts: '发帖排行',
  likes: '获赞排行',
  comments: '评论排行',
}

const tabUnits: Record<string, string> = {
  level: '级',
  posts: '篇',
  likes: '赞',
  comments: '条',
}

const fetchFunctions: Record<string, (params: { page: number; limit: number }) => Promise<{ data: LeaderboardEntry[]; meta: { totalPages: number } }>> = {
  level: getByLevel,
  posts: getByPosts,
  likes: getByLikes,
  comments: getByComments,
}

async function fetchData() {
  loading.value = true
  try {
    const fn = fetchFunctions[activeTab.value]
    if (!fn) return
    const res = await fn({ page: currentPage.value, limit: pageSize })
    entries.value = res.data
    totalPages.value = res.meta.totalPages
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取排行榜数据失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  currentPage.value = 1
  fetchData()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToUser(userId: string) {
  router.push(`/user/${userId}`)
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '\u{1F947}'
  if (rank === 2) return '\u{1F948}'
  if (rank === 3) return '\u{1F949}'
  return ''
}

function getMedalClass(rank: number): string {
  if (rank === 1) return 'leaderboard-entry--gold'
  if (rank === 2) return 'leaderboard-entry--silver'
  if (rank === 3) return 'leaderboard-entry--bronze'
  return ''
}

function getLevelColor(level: number): string {
  if (level >= 20) return '#e74c3c'
  if (level >= 15) return '#e67e22'
  if (level >= 10) return '#9b59b6'
  if (level >= 5) return '#3498db'
  return '#27ae60'
}

// 初始加载
fetchData()
</script>

<template>
  <div class="leaderboard-view">
    <div class="leaderboard-header">
      <n-icon :component="TrophyOutline" :size="28" color="#f0a500" />
      <h1 class="leaderboard-title">排行榜</h1>
    </div>

    <n-card>
      <n-tabs v-model:value="activeTab" type="line" @update:value="handleTabChange">
        <n-tab-pane
          v-for="(label, key) in tabLabels"
          :key="key"
          :name="key"
          :tab="label"
        />
      </n-tabs>

      <n-spin :show="loading" class="leaderboard-content">
        <n-empty v-if="!loading && entries.length === 0" description="暂无排行数据" />

        <!-- 前三名特殊展示 -->
        <div v-if="entries.length >= 3" class="leaderboard-top3">
          <div
            v-for="entry in entries.slice(0, 3)"
            :key="entry.user.id"
            class="top3-item"
            :class="getMedalClass(entry.rank)"
            @click="goToUser(entry.user.id)"
          >
            <div class="top3-medal">{{ getMedalEmoji(entry.rank) }}</div>
            <n-avatar
              :src="getUserAvatar(entry.user.avatar, entry.user.username)"
              :size="entry.rank === 1 ? 72 : 60"
              round
              class="top3-avatar"
            />
            <div class="top3-info">
              <span class="top3-username">{{ entry.user.username }}</span>
              <n-tag :bordered="false" size="small" :color="{ color: getLevelColor(entry.user.level) + '20', textColor: getLevelColor(entry.user.level) }">
                Lv{{ entry.user.level }}
              </n-tag>
            </div>
            <div class="top3-value">
              <span class="top3-value-num">{{ entry.value }}</span>
              <span class="top3-value-unit">{{ tabUnits[activeTab] }}</span>
            </div>
          </div>
        </div>

        <!-- 其余排名列表 -->
        <div v-if="entries.length > 3" class="leaderboard-list">
          <div
            v-for="entry in entries.slice(3)"
            :key="entry.user.id"
            class="leaderboard-entry"
            @click="goToUser(entry.user.id)"
          >
            <span class="leaderboard-entry__rank">{{ entry.rank }}</span>
            <n-avatar
              :src="getUserAvatar(entry.user.avatar, entry.user.username)"
              :size="40"
              round
            />
            <span class="leaderboard-entry__name">{{ entry.user.username }}</span>
            <n-tag :bordered="false" size="small" :color="{ color: getLevelColor(entry.user.level) + '20', textColor: getLevelColor(entry.user.level) }">
              Lv{{ entry.user.level }}
            </n-tag>
            <span class="leaderboard-entry__value">
              {{ entry.value }} {{ tabUnits[activeTab] }}
            </span>
          </div>
        </div>

        <!-- 如果不足 3 人，直接显示列表 -->
        <div v-if="entries.length > 0 && entries.length < 3" class="leaderboard-list">
          <div
            v-for="entry in entries"
            :key="entry.user.id"
            class="leaderboard-entry"
            :class="getMedalClass(entry.rank)"
            @click="goToUser(entry.user.id)"
          >
            <span class="leaderboard-entry__rank">
              <template v-if="getMedalEmoji(entry.rank)">{{ getMedalEmoji(entry.rank) }}</template>
              <template v-else>{{ entry.rank }}</template>
            </span>
            <n-avatar
              :src="getUserAvatar(entry.user.avatar, entry.user.username)"
              :size="40"
              round
            />
            <span class="leaderboard-entry__name">{{ entry.user.username }}</span>
            <n-tag :bordered="false" size="small" :color="{ color: getLevelColor(entry.user.level) + '20', textColor: getLevelColor(entry.user.level) }">
              Lv{{ entry.user.level }}
            </n-tag>
            <span class="leaderboard-entry__value">
              {{ entry.value }} {{ tabUnits[activeTab] }}
            </span>
          </div>
        </div>
      </n-spin>

      <div v-if="totalPages > 1" class="leaderboard-pagination">
        <n-pagination
          :page="currentPage"
          :page-count="totalPages"
          :page-size="pageSize"
          show-quick-jumper
          @update:page="handlePageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.leaderboard-view {
  max-width: 900px;
  margin: 0 auto;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.leaderboard-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.leaderboard-content {
  min-height: 200px;
  margin-top: 16px;
}

/* 前三名 */
.leaderboard-top3 {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px 0;
}

.top3-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  min-width: 140px;
  position: relative;
}

.top3-item:hover {
  transform: translateY(-4px);
}

.top3-item--gold {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
  border: 2px solid #f0c040;
  box-shadow: 0 4px 16px rgba(240, 192, 64, 0.3);
}

.top3-item--silver {
  background: linear-gradient(135deg, #f8f8f8 0%, #eeeeee 100%);
  border: 2px solid #c0c0c0;
  box-shadow: 0 4px 16px rgba(192, 192, 192, 0.3);
}

.top3-item--bronze {
  background: linear-gradient(135deg, #fdf5ef 0%, #f5e6d3 100%);
  border: 2px solid #cd7f32;
  box-shadow: 0 4px 16px rgba(205, 127, 50, 0.3);
}

.top3-medal {
  font-size: 32px;
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
}

.top3-avatar {
  margin-top: 12px;
}

.top3-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.top3-username {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top3-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.top3-value-num {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.top3-value-unit {
  font-size: 12px;
  color: #999;
}

/* 列表 */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.leaderboard-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.leaderboard-entry:hover {
  background: #f5f5f5;
}

.leaderboard-entry__rank {
  width: 36px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #999;
  flex-shrink: 0;
}

.leaderboard-entry__name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboard-entry__value {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

.leaderboard-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .leaderboard-top3 {
    flex-direction: column;
    align-items: center;
  }

  .top3-item {
    flex-direction: row;
    width: 100%;
    min-width: auto;
  }

  .top3-medal {
    position: static;
    transform: none;
    font-size: 24px;
  }

  .top3-avatar {
    margin-top: 0;
  }

  .top3-info {
    flex-direction: row;
    align-items: center;
  }

  .leaderboard-title {
    font-size: 22px;
  }
}
</style>
