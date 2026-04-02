<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()
const { t } = useI18n()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度为 3-30 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string) => {
        if (value !== formData.password) {
          return new Error('两次输入的密码不一致')
        }
        return true
      },
      trigger: 'blur',
    },
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
    await userStore.register(formData.username, formData.email, formData.password)
    message.success(t('auth.registerSuccess'))
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : '注册失败，请稍后重试'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <n-card :title="t('auth.registerTitle')" class="register-card" :bordered="false">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="0"
        size="large"
      >
        <n-form-item path="username" label="">
          <n-input
            v-model:value="formData.username"
            :placeholder="t('auth.username') + '（3-30）'"
            :input-props="{ autocomplete: 'username' }"
          />
        </n-form-item>
        <n-form-item path="email" label="">
          <n-input
            v-model:value="formData.email"
            :placeholder="t('auth.email')"
            :input-props="{ autocomplete: 'email' }"
          />
        </n-form-item>
        <n-form-item path="password" label="">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            :placeholder="t('auth.password') + '（6+）'"
            :input-props="{ autocomplete: 'new-password' }"
          />
        </n-form-item>
        <n-form-item path="confirmPassword" label="">
          <n-input
            v-model:value="formData.confirmPassword"
            type="password"
            show-password-on="click"
            :placeholder="t('auth.confirmPassword')"
            :input-props="{ autocomplete: 'new-password' }"
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
            {{ t('auth.registerButton') }}
          </n-button>
        </n-form-item>
      </n-form>
      <n-space justify="center">
        <router-link to="/login" class="link">{{ t('auth.hasAccount') }}{{ t('auth.goLogin') }}</router-link>
      </n-space>
    </n-card>
  </div>
</template>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--n-color);
}

.register-card {
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
