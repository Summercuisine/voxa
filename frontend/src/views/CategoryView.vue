<script setup lang="ts">
// 分类视图
defineProps<{
  id: string
}>()
</script>

<template>
  <div class="category-view">
    <h1>Category #{{ id }}</h1>
  </div>
</template>

<style scoped>
.category-view {
  padding: 24px;
}
</style>
