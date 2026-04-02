<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NDivider } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formData = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await userStore.login(formData.email, formData.password)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : '登录失败，请检查邮箱和密码'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

function handleGithubLogin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.location.href = `${apiBase}/auth/github`
}

function handleGoogleLogin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  window.location.href = `${apiBase}/auth/google`
}
</script>

<template>
  <div class="login-page">
    <n-card title="登录" class="login-card" :bordered="false">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="0"
        size="large"
      >
        <n-form-item path="email" label="">
          <n-input
            v-model:value="formData.email"
            placeholder="邮箱地址"
            :input-props="{ autocomplete: 'email' }"
            @keyup.enter="handleSubmit"
          />
        </n-form-item>
        <n-form-item path="password" label="">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="密码"
            :input-props="{ autocomplete: 'current-password' }"
            @keyup.enter="handleSubmit"
          />
        </n-form-item>
        <n-form-item label="">
          <n-button
            type="primary"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </n-button>
        </n-form-item>
      </n-form>

      <n-divider>或</n-divider>

      <n-space vertical :size="12">
        <n-button block secondary @click="handleGithubLogin">
          GitHub 登录
        </n-button>
        <n-button block secondary @click="handleGoogleLogin">
          Google 登录
        </n-button>
      </n-space>

      <n-space justify="center" style="margin-top: 16px">
        <router-link to="/register" class="link">没有账号？去注册</router-link>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--n-color);
}

.login-card {
  width: 400px;
  max-width: 90vw;
}

.link {
  color: #18a058;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
