<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NSpin, NResult } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMsg = ref('')

onMounted(async () => {
  try {
    const token = route.query.token as string
    if (!token) {
      status.value = 'error'
      errorMsg.value = '未收到认证令牌'
      return
    }

    // 存储 token
    userStore.setToken(token)

    // 获取用户信息
    await userStore.fetchProfile()

    status.value = 'success'
    message.success('登录成功')

    // 跳转首页
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (err: unknown) {
    status.value = 'error'
    errorMsg.value = err instanceof Error ? err.message : '登录失败'
  }
})
</script>

<template>
  <div class="auth-callback-page">
    <n-spin v-if="status === 'loading'" size="large" />
    <n-result
      v-else-if="status === 'success'"
      status="success"
      title="登录成功"
      description="正在跳转到首页..."
    />
    <n-result
      v-else
      status="error"
      title="登录失败"
      :description="errorMsg"
    >
      <template #footer>
        <a href="/login" style="color: #18a058; text-decoration: none">返回登录</a>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
.auth-callback-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
