import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: {}
  }),
  actions: {
    setToken(token: string) {
      this.token = token
      uni.setStorageSync('token', token)
    }
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user-store',
        storage: {
          getItem: (key: string) => uni.getStorageSync(key),
          setItem: (key: string, value: any) => uni.setStorageSync(key, value),
          removeItem: (key: string) => uni.removeStorageSync(key)
        }
      }
    ]
  }
})
