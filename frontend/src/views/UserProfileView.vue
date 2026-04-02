<script setup lang="ts">
// 用户资料视图
defineProps<{
  id: string
}>()
</script>

<template>
  <div class="user-profile-view">
    <h1>User #{{ id }}</h1>
  </div>
</template>

<style scoped>
.user-profile-view {
  padding: 24px;
}
</style>
