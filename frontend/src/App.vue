<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <template #sider>
      <div class="logo">Voxa</div>
    </template>
  </AppLayout>
</template>

<style scoped>
.logo {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  padding: 16px 0;
  color: #18a058;
}
</style>
