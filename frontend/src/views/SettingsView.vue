<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NInput,
  NAvatar,
  NForm,
  NFormItem,
  NSpace,
  NIcon,
  NDivider,
} from 'naive-ui'
import { SaveOutline } from '@vicons/ionicons5'
import { updateUser, getUser } from '@/api/users'
import { useUserStore } from '@/stores/user'
import { getUserAvatar } from '@/utils'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 表单状态
const username = ref('')
const avatar = ref('')
const bio = ref('')
const saving = ref(false)

// 加载当前用户信息
async function loadUser() {
  if (!userStore.currentUser?.id) return
  try {
    const res = await getUser(userStore.currentUser.id)
    username.value = res.username
    avatar.value = res.avatar || ''
    bio.value = res.bio || ''
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取用户信息失败'
    message.error(errorMsg)
  }
}

// 表单验证
function validate(): boolean {
  if (!username.value.trim()) {
    message.warning('用户名不能为空')
    return false
  }
  if (username.value.trim().length < 2) {
    message.warning('用户名至少 2 个字符')
    return false
  }
  return true
}

// 保存
async function handleSave() {
  if (!validate() || !userStore.currentUser?.id) return

  saving.value = true
  try {
    const res = await updateUser(userStore.currentUser.id, {
      username: username.value.trim(),
      avatar: avatar.value.trim() || undefined,
      bio: bio.value.trim() || undefined,
    })
    userStore.setUser(res)
    message.success('保存成功')
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '保存失败'
    message.error(errorMsg)
  } finally {
    saving.value = false
  }
}

// 检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  loadUser()
})
</script>

<template>
  <div class="settings-view">
    <n-card title="个人设置" class="settings-card">
      <n-form label-placement="top">
        <!-- 头像预览 -->
        <n-form-item label="头像">
          <div class="avatar-preview">
            <n-avatar
              :src="getUserAvatar(avatar || null, username)"
              :size="64"
              round
            />
          </div>
        </n-form-item>

        <n-form-item label="头像 URL">
          <n-input
            v-model:value="avatar"
            placeholder="请输入头像图片 URL"
          />
        </n-form-item>

        <n-form-item label="用户名" required>
          <n-input
            v-model:value="username"
            placeholder="请输入用户名"
            maxlength="30"
            show-count
          />
        </n-form-item>

        <n-form-item label="个人简介">
          <n-input
            v-model:value="bio"
            type="textarea"
            placeholder="介绍一下自己..."
            :rows="4"
            maxlength="200"
            show-count
          />
        </n-form-item>

        <n-divider />

        <div class="settings-actions">
          <n-button
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            <template #icon>
              <n-icon :component="SaveOutline" />
            </template>
            保存修改
          </n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
}

.settings-card {
  margin-top: 16px;
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .settings-card {
    margin-top: 8px;
  }
}
</style>
