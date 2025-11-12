import type { PiniaPluginContext } from 'pinia'

// 让所有 persist 使用 uni 存储而不是 window.localStorage
export default function piniaPersistUni(context: PiniaPluginContext) {
  const persist = context.options.persist
  if (persist && typeof persist === 'object') {
    if (Array.isArray(persist.strategies)) {
      persist.strategies.forEach((s) => {
        s.storage = {
          getItem: (key: string) => uni.getStorageSync(key),
          setItem: (key: string, val: any) => uni.setStorageSync(key, val),
          removeItem: (key: string) => uni.removeStorageSync(key)
        }
      })
    } else {
      persist.storage = {
        getItem: (key: string) => uni.getStorageSync(key),
        setItem: (key: string, val: any) => uni.setStorageSync(key, val),
        removeItem: (key: string) => uni.removeStorageSync(key)
      }
    }
  }
}
