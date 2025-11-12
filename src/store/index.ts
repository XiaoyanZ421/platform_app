// src/store/index.ts
import type { App } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 导入子模块
//import useAppStore from './modules/app'

const pinia = createPinia()

// 创建持久化插件（适配 uniapp 存储）
const piniaPersist = createPersistedState({
  storage: {
    getItem: uni.getStorageSync,
    setItem: uni.setStorageSync,
  },
})

// 使用持久化插件
pinia.use(piniaPersist)

// 安装 pinia 到 Vue 应用
function setupStore(app: App) {
  app.use(pinia)
}



// 模块统一导出
export { useAppStore }
export default setupStore

// 模块统一导出
export * from './user'
export * from './navigation'

