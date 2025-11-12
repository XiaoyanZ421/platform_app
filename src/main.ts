// main.ts

import '@/polyfill/localStorageFix.js'
import { createSSRApp } from 'vue'
import App from '@/App.vue'
import { createPinia } from 'pinia'
import piniaPersistUni from '@/plugins/piniaPersistUni'
import piniaPersist from 'pinia-plugin-persistedstate'
import vant from 'vant'
import 'vant/lib/index.css'
import 'virtual:uno.css'

// 🟢 引入 i18n 语言配置
import { createI18n } from 'vue-i18n'
import zh from '@/i18n/lang/zh'
import en from '@/i18n/lang/en'

// 🟢 获取缓存语言，默认中文
const savedLang = uni.getStorageSync('lang') || 'zh'

// 🟢 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: savedLang,
  fallbackLocale: 'zh',
  messages: { zh, en },
})

// 🟢 创建 Pinia 实例
const pinia = createPinia()
pinia.use(piniaPersistUni)
pinia.use(piniaPersist)

// 🟢 创建 App
export function createApp() {
  const app = createSSRApp(App)
  app.use(pinia)
  app.use(vant)
  app.use(i18n)
  return { app }
}

// 🟢 导出全局实例（供其他模块使用）
export { pinia, i18n }
