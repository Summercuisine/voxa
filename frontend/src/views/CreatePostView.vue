<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  NCard,
  NButton,
  NSelect,
  NSpace,
  NDynamicTags,
  NIcon,
  NForm,
  NFormItem,
} from 'naive-ui'
import { SendOutline } from '@vicons/ionicons5'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { createPost } from '@/api/posts'
import { getCategories } from '@/api/categories'
import { uploadImage } from '@/api/upload'
import { useUserStore } from '@/stores/user'
import type { Category } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 表单状态
const title = ref('')
const content = ref('')
const categoryId = ref<string | null>(null)
const tags = ref<string[]>([])
const submitting = ref(false)

// 分类列表
const categories = ref<Category[]>([])
const categoryOptions = ref<{ label: string; value: string }[]>([])

// 获取分类列表
async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res
    categoryOptions.value = res.map((cat) => ({
      label: cat.name,
      value: cat.id,
    }))
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '获取分类列表失败'
    message.error(errorMsg)
  }
}

// 图片上传回调
async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  const urls: string[] = []
  for (const file of files) {
    try {
      const res = await uploadImage(file)
      urls.push(res.url)
    } catch {
      message.error(`图片 ${file.name} 上传失败`)
    }
  }
  callback(urls)
}

// 表单验证
function validate(): boolean {
  if (!title.value.trim()) {
    message.warning('请输入帖子标题')
    return false
  }
  if (!categoryId.value) {
    message.warning('请选择分类')
    return false
  }
  if (!content.value.trim()) {
    message.warning('请输入帖子内容')
    return false
  }
  return true
}

// 提交
async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    const res = await createPost({
      title: title.value.trim(),
      content: content.value.trim(),
      categoryId: categoryId.value ?? undefined,
      tags: tags.value.length > 0 ? tags.value : undefined,
    })
    message.success('发帖成功')
    router.push(`/post/${res.id}`)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '发帖失败'
    message.error(errorMsg)
  } finally {
    submitting.value = false
  }
}

// 检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  fetchCategories()
})
</script>

<template>
  <div class="create-post-view">
    <n-card title="创建新帖子" class="create-post-card">
      <n-form label-placement="top">
        <n-form-item label="标题" required>
          <n-input
            v-model:value="title"
            placeholder="请输入帖子标题"
            maxlength="100"
            show-count
          />
        </n-form-item>

        <n-form-item label="分类" required>
          <n-select
            v-model:value="categoryId"
            :options="categoryOptions"
            placeholder="请选择分类"
          />
        </n-form-item>

        <n-form-item label="标签">
          <n-dynamic-tags v-model:value="tags" />
        </n-form-item>

        <n-form-item label="内容" required>
          <MdEditor
            v-model="content"
            language="zh-CN"
            :preview="true"
            :toolbars-exclude="['github']"
            placeholder="请输入帖子内容（支持 Markdown）..."
            @on-upload-img="handleUploadImg"
            style="height: 500px"
          />
        </n-form-item>

        <div class="create-post-actions">
          <n-button @click="router.back()">取消</n-button>
          <n-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            <template #icon>
              <n-icon :component="SendOutline" />
            </template>
            发布帖子
          </n-button>
        </div>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
.create-post-view {
  max-width: 800px;
  margin: 0 auto;
}

.create-post-card {
  margin-top: 16px;
}

.create-post-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 640px) {
  .create-post-card {
    margin-top: 8px;
  }
}
</style>
