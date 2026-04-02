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
  NIcon,
  NDivider,
  NProgress,
  NUpload,
} from 'naive-ui'
import { SaveOutline, CameraOutline } from '@vicons/ionicons5'
import { updateUser, getUser } from '@/api/users'
import { uploadImage } from '@/api/upload'
import { useUserStore } from '@/stores/user'
import { getUserAvatar } from '@/utils'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 表单状态
const username = ref('')
const avatar = ref('')
const bio = ref('')
const title = ref('')
const saving = ref(false)

// 密码修改状态
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)

// 头像上传状态
const uploadingAvatar = ref(false)
const uploadProgress = ref(0)

// 加载当前用户信息
async function loadUser() {
  if (!userStore.currentUser?.id) return
  try {
    const res = await getUser(userStore.currentUser.id)
    username.value = res.username
    avatar.value = res.avatar || ''
    bio.value = res.bio || ''
    title.value = res.title || ''
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取用户信息失败'
    message.error(errorMsg)
  }
}

// 头像上传
async function handleAvatarUpload({ file }: { file: { file: File } }) {
  const imageFile = file.file
  if (!imageFile) return

  // 验证文件类型
  if (!imageFile.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }

  // 验证文件大小（5MB）
  if (imageFile.size > 5 * 1024 * 1024) {
    message.warning('图片大小不能超过 5MB')
    return
  }

  uploadingAvatar.value = true
  uploadProgress.value = 0

  try {
    const res = await uploadImage(imageFile)
    avatar.value = res.url
    message.success('头像上传成功')
  } catch {
    message.error('头像上传失败')
  } finally {
    uploadingAvatar.value = false
    uploadProgress.value = 0
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
      title: title.value.trim() || undefined,
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

// 密码修改验证
function validatePassword(): boolean {
  if (!oldPassword.value) {
    message.warning('请输入旧密码')
    return false
  }
  if (!newPassword.value) {
    message.warning('请输入新密码')
    return false
  }
  if (newPassword.value.length < 6) {
    message.warning('新密码至少 6 个字符')
    return false
  }
  if (newPassword.value !== confirmPassword.value) {
    message.warning('两次输入的密码不一致')
    return false
  }
  return true
}

// 修改密码
async function handleChangePassword() {
  if (!validatePassword() || !userStore.currentUser?.id) return

  changingPassword.value = true
  try {
    const { default: apiClient } = await import('@/api')
    await apiClient.patch(`/users/${userStore.currentUser.id}/password`, {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    message.success('密码修改成功')
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '密码修改失败'
    message.error(errorMsg)
  } finally {
    changingPassword.value = false
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
        <!-- 头像上传 -->
        <n-form-item label="头像">
          <div class="avatar-upload">
            <div class="avatar-preview">
              <n-avatar
                :src="getUserAvatar(avatar || null, username)"
                :size="80"
                round
              />
              <div v-if="!uploadingAvatar" class="avatar-overlay">
                <n-icon :component="CameraOutline" :size="24" color="#fff" />
              </div>
              <div v-else class="avatar-overlay">
                <n-progress
                  type="circle"
                  :percentage="uploadProgress"
                  :show-indicator="false"
                  :width="40"
                  :stroke-width="3"
                  color="#fff"
                  :rail-color="'rgba(255,255,255,0.3)'"
                />
              </div>
            </div>
            <n-upload
              :show-file-list="false"
              accept="image/*"
              :custom-request="handleAvatarUpload as any"
            >
              <n-button size="small" :loading="uploadingAvatar">
                上传头像
              </n-button>
            </n-upload>
          </div>
        </n-form-item>

        <n-form-item label="头像 URL">
          <n-input
            v-model:value="avatar"
            placeholder="或直接输入头像图片 URL"
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

        <n-form-item label="自定义头衔">
          <n-input
            v-model:value="title"
            placeholder="设置你的个性头衔"
            maxlength="20"
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

    <!-- 密码修改 -->
    <n-card title="修改密码" class="settings-card settings-card--password">
      <n-form label-placement="top">
        <n-form-item label="旧密码">
          <n-input
            v-model:value="oldPassword"
            type="password"
            show-password-on="click"
            placeholder="请输入旧密码"
          />
        </n-form-item>

        <n-form-item label="新密码">
          <n-input
            v-model:value="newPassword"
            type="password"
            show-password-on="click"
            placeholder="请输入新密码（至少 6 个字符）"
          />
        </n-form-item>

        <n-form-item label="确认新密码">
          <n-input
            v-model:value="confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入新密码"
          />
        </n-form-item>

        <div class="settings-actions">
          <n-button
            type="warning"
            :loading="changingPassword"
            :disabled="!oldPassword || !newPassword || !confirmPassword"
            @click="handleChangePassword"
          >
            修改密码
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

.settings-card--password {
  margin-top: 20px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
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
