<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui'
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import AppLayout from '@/components/common/AppLayout.vue'

const themeStore = useThemeStore()
const naiveTheme = computed(() => (themeStore.isDark ? darkTheme : null))
</script>

<template>
  <n-config-provider :theme="naiveTheme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <AppLayout />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
