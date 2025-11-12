<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log('App Launch');

  // ✅ localStorage 兼容处理（iOS 基座启动时报 window.localStorage 错）
  if (typeof window !== 'undefined' && !window.localStorage) {
    console.warn('⚠️ 检测到 window.localStorage 不存在，创建 polyfill');
    window.localStorage = {
      getItem(key: string) {
        try {
          return uni.getStorageSync(key);
        } catch (e) {
          console.error('getItem error:', e);
          return null;
        }
      },
      setItem(key: string, value: any) {
        try {
          uni.setStorageSync(key, value);
        } catch (e) {
          console.error('setItem error:', e);
        }
      },
      removeItem(key: string) {
        try {
          uni.removeStorageSync(key);
        } catch (e) {
          console.error('removeItem error:', e);
        }
      },
      clear() {
        try {
          uni.clearStorageSync();
        } catch (e) {
          console.error('clear error:', e);
        }
      },
    };
  }

  // ✅ 第一次启动时初始化存储（避免 iOS 第一次 localStorage 未定义）
  const firstLoginFlag = uni.getStorageSync('firstLoginInit');
  if (!firstLoginFlag) {
    uni.setStorageSync('firstLoginInit', true);
    uni.setStorageSync('initTime', Date.now());
    console.log('✅ 首次启动初始化 localStorage 成功');
  }

  // #ifdef MP-WEIXIN
  // 微信小程序专属逻辑（如果需要）
  // #endif
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 每个页面公共css */
@import 'uview-plus/index.scss';
@import '@/static/styles/common.scss';
</style>
