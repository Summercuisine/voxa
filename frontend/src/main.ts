import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './locales'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 全局注册 naive-ui（按需导入方式，通过 unplugin-vue-components 自动按需引入）
// naive-ui 支持全局引入，此处使用全量注册
import naive from 'naive-ui'
app.use(naive)

app.use(i18n)

app.mount('#app')
