<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NGrid,
  NGridItem,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NIcon,
} from 'naive-ui'
import { RibbonOutline } from '@vicons/ionicons5'
import { getAllBadges, getMyBadges } from '@/api/badges'
import type { Badge } from '@/types'

const message = useMessage()

const loading = ref(false)
const allBadges = ref<Badge[]>([])
const myBadges = ref<Badge[]>([])

const earnedCount = computed(() => allBadges.value.filter(b => b.earned).length)
const totalCount = computed(() => allBadges.value.length)

async function fetchData() {
  loading.value = true
  try {
    const [allRes, myRes] = await Promise.all([
      getAllBadges(),
      getMyBadges().catch(() => [] as Badge[]),
    ])
    allBadges.value = allRes.map(badge => ({
      ...badge,
      earned: myRes.some(mine => mine.id === badge.id),
      earnedAt: myRes.find(mine => mine.id === badge.id)?.earnedAt,
    }))
    myBadges.value = myRes
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取徽章数据失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

fetchData()
</script>

<template>
  <div class="badges-view">
    <div class="badges-header">
      <n-icon :component="RibbonOutline" :size="28" color="#9b59b6" />
      <h1 class="badges-title">徽章成就</h1>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && allBadges.length === 0" description="暂无徽章数据" />

      <n-grid v-else :x-gap="16" :y-gap="16" :cols="3" responsive="screen" item-responsive>
        <n-grid-item v-for="badge in allBadges" :key="badge.id" span="3 m:1">
          <div class="badge-card" :class="{ 'badge-card--earned': badge.earned, 'badge-card--locked': !badge.earned }">
            <div class="badge-card__icon">
              <span class="badge-card__emoji">{{ badge.icon }}</span>
              <div v-if="!badge.earned" class="badge-card__overlay" />
            </div>
            <div class="badge-card__info">
              <div class="badge-card__name">
                {{ badge.name }}
                <n-tag v-if="badge.isRare" type="warning" size="small" :bordered="false" class="badge-card__rare">
                  稀有
                </n-tag>
              </div>
              <p class="badge-card__desc">{{ badge.description }}</p>
              <p v-if="badge.earned && badge.earnedAt" class="badge-card__earned-at">
                获得于 {{ new Date(badge.earnedAt).toLocaleDateString('zh-CN') }}
              </p>
              <p v-else-if="!badge.earned" class="badge-card__not-earned">未获得</p>
            </div>
          </div>
        </n-grid-item>
      </n-grid>
    </n-spin>

    <div v-if="allBadges.length > 0" class="badges-stats">
      已获得 {{ earnedCount }}/{{ totalCount }} 个徽章
    </div>
  </div>
</template>

<style scoped>
.badges-view {
  max-width: 900px;
  margin: 0 auto;
}

.badges-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.badges-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.badge-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.badge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.badge-card--earned {
  border-color: #e8f5e9;
  background: linear-gradient(135deg, #ffffff 0%, #f9fff9 100%);
}

.badge-card--locked {
  opacity: 0.6;
}

.badge-card__icon {
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-card__emoji {
  font-size: 40px;
  line-height: 1;
}

.badge-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.badge-card__info {
  flex: 1;
  min-width: 0;
}

.badge-card__name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-card__rare {
  flex-shrink: 0;
}

.badge-card__desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.badge-card__earned-at {
  font-size: 12px;
  color: #27ae60;
  margin: 0;
}

.badge-card__not-earned {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.badges-stats {
  text-align: center;
  margin-top: 24px;
  padding: 16px;
  font-size: 15px;
  color: #666;
  background: #fafafa;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .badges-title {
    font-size: 22px;
  }

  .badge-card {
    padding: 14px;
  }

  .badge-card__emoji {
    font-size: 32px;
  }
}
</style>
