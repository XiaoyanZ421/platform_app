// 兼容性补丁，避免因缺少localStorage导致的运行时错误
(function () {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (!window.localStorage) {
      window.localStorage = {
        getItem(key) {
          try {
            return uni.getStorageSync(key)
          } catch (e) {
            console.error('[polyfill] getItem error', e)
            return null
          }
        },
        setItem(key, val) {
          try {
            uni.setStorageSync(key, val)
          } catch (e) {
            console.error('[polyfill] setItem error', e)
          }
        },
        removeItem(key) {
          try {
            uni.removeStorageSync(key)
          } catch (e) {
            console.error('[polyfill] removeItem error', e)
          }
        },
        clear() {
          try {
            uni.clearStorageSync()
          } catch (e) {
            console.error('[polyfill] clear error', e)
          }
        }
      }
    } 
  } catch (err) {
    console.error('[polyfill] failed to patch localStorage', err)
  }
})()
