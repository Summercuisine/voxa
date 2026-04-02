<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent } from 'naive-ui'
</script>

<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      :width="240"
      :collapsed-width="64"
      collapse-mode="width"
      show-trigger
    >
      <div class="sider-content">
        <!-- 侧边栏导航内容 -->
        <slot name="sider">
          <div class="logo">Voxa</div>
        </slot>
      </div>
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 56px; padding: 0 24px; display: flex; align-items: center">
        <slot name="header">
          <!-- 顶部导航栏内容 -->
        </slot>
      </n-layout-header>
      <n-layout-content
        content-style="padding: 24px;"
        :native-scrollbar="false"
        style="height: calc(100vh - 56px)"
      >
        <RouterView />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.sider-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  padding: 16px 0;
  color: #18a058;
}
</style>
