<script setup lang="ts">
// 帖子详情视图
defineProps<{
  id: string
}>()
</script>

<template>
  <div class="post-detail-view">
    <h1>Post #{{ id }}</h1>
  </div>
</template>

<style scoped>
.post-detail-view {
  padding: 24px;
}
</style>
