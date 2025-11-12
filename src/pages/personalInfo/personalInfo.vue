<template>
	<van-config-provider :theme-vars="themeVars">
  <van-nav-bar
    :title="t('personal.title')"
	:safe-area-inset-top= "true"
    style="
      background-color: #2665AA;
    "
  />
  
  
  </van-config-provider>
  <view class="factory-app">
    <!-- 用户信息区域 + 密码项 -->
    <view class="user-section">
      <!-- 用户信息 -->
      <view class="user-info" style="margin-top: 20px;">
        <view class="avatar-section">
          <image class="avatar" src="@/static/images/avatar.png" mode="aspectFill"></image>
          <view class="user-detail">
            <text class="username">{{ organizesName }} - {{ userName }}</text>
            <text class="code">{{code}}</text>
          </view>
        </view>
      </view>
	</view>

    <!-- 功能列表（白色卡片区域） -->
    <view class="function-list" style="margin-top: 20px;">
      <view class="function-item" @click="goToChangePwd">
        <view class="item-left">
          <text class="item-text">{{ t('personal.changePassword') }}</text>
        </view>
        <view class="item-right">
          <van-icon name="arrow" size="16" color="#999" />
        </view>
      </view>

      <view class="function-item" @click="resetPwd">
        <view class="item-left">
          <text class="item-text">{{ t('personal.resetPassword') }}</text>
        </view>
        <view class="item-right">
          <van-icon name="arrow" size="16" color="#999" />
        </view>
      </view>
    </view>
	
	<view class="logout-section">
	      <van-button 
	        block
			type="primary"
			color="white"
			style="color: red;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
	        @click="handleLogout"
	      >
	        {{ t('personal.logout') }}
	      </van-button>
	  </view>
  </view>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useInitializePassword, useGetUserByCodeAsync } from '@/api/user';
import { Dialog  } from 'vant'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const themeVars = reactive({
  navBarTitleTextColor: '#ffffff'
});

// 使用ref创建响应式变量
const userName = ref('')
const userId = ref('')
const code = ref('')
const organizesName = ref('')

// 获取用户信息函数
const fetchUserInfo = async () => {
  try {
    const res = await useGetUserByCodeAsync({usercode: code.value})
    if (res.code === 200 && res.success) {
      // 读取组织名称
      organizesName.value = res.data.displayName.oraganizesName
    } else {
      console.error('获取用户信息失败:', res.message)
    }
  } catch (error) {
    console.error('调用useGetUserByCodeAsync接口失败:', error)
    uni.showToast({
      title: t('personal.getUserInfoFailed'),
      icon: 'none'
    })
  }
}

// 修改密码
const goToChangePwd = () => {
  uni.navigateTo({
    url: '/pages/personalInfo/changepwd'
  });
};

// 重置密码函数
const resetPwd = () => {
  uni.showModal({
    title: t('personal.tip'),
    content: t('personal.resetPasswordConfirm'),
    success: (res) => {
      if (res.confirm) {
        if (!userId.value) {
          console.log(t('personal.invalidUserId'))
          return
        }
        useInitializePassword({ idsUserId: userId.value })
          .then(response => {
            uni.showToast({ 
              title: t('personal.resetPasswordSuccess'), 
              icon: 'success' 
            })
            console.log(t('personal.resetPasswordSuccess'), response)
          })
          .catch(error => {
            console.error(t('personal.resetPasswordFailed'), error)
            uni.showToast({ 
              title: t('personal.resetPasswordFailed'), 
              icon: 'none' 
            })
          })
      } else {
        console.log(t('personal.resetPasswordCanceled'))
      }
    }
  })
}

const handleLogout = () => {
  uni.showModal({
    title: t('personal.tip'),
    content: t('personal.logoutConfirm'),
    success: (res) => {
      if (res.confirm) {
        // 用户点击了确定
        // 1. 清除本地存储
        uni.removeStorageSync('access_token');
        uni.removeStorageSync('refresh_token');
        uni.removeStorageSync('userName');
        uni.removeStorageSync('userId');
        uni.removeStorageSync('code');

        // 2. 显示退出提示
        uni.showToast({
          title: t('personal.logoutSuccess'),
          icon: 'success',
        });

        // 3. 跳转登录页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login',
          });
        }, 1500);
      } else if (res.cancel) {
        // 用户点击了取消
        console.log(t('personal.logoutCanceled'));
      }
    }
  });
};

onMounted(() => {
  // 初始化时从存储中获取值
  userName.value = uni.getStorageSync('userName') || ''
  userId.value = uni.getStorageSync('userId') || ''
  code.value = uni.getStorageSync('code') || ''
  
  // 获取用户详细信息
  fetchUserInfo()
})
</script>

<style scoped>
.factory-app {
  min-height: 100vh;
  position: relative;
  top: -20px;
  background: linear-gradient(to bottom, 
    #2665AA 0%,
    #ffffff 30%,
    #ffffff 30%,
    #ffffff 100%
  );
}
.login-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 291px;
  object-fit: cover;
  z-index: 0;
}

/* 用户信息区域容器 */
.user-section {
  position: relative;
  z-index: 1;
  padding: 0 20px;
}

/* 用户信息 */
.user-info {
  padding: 30px 0 20px 0;
  color: #fff;
  margin-bottom: 30px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  background-color: #fff;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.code {
  font-size: 14px;
  opacity: 0.9;
}

/* 密码项 - 在蓝色背景上 */
.password-on-bg {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.password-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-left {
  display: flex;
  flex-direction: column;
}

.password-label {
  font-size: 16px;
  color: #000000;
  font-weight: 500;
}

.password-sub-label {
  font-size: 12px;
  color: #000000;
  margin-top: 2px;
}

.password-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modify-text {
  font-size: 14px;
  color: #fff;
}

/* 导航栏 */
.navbar {
  height: 44px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
  z-index: 1;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
}

/* 功能列表（白色卡片） */
.function-list {
  background: #fff;
  margin: 0 15px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
}

.function-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 20px;
  border-bottom: 1px solid #f0f0f0;
  min-height: 60px;
}

.function-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-text {
  font-size: 16px;
  color: #333;
  line-height: 1.4;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modify-text {
  font-size: 14px;
  color: #1E59A0;
}

.version-text {
  font-size: 14px;
  color: #666;
}

.function-item:active {
  background-color: #f8f9fa;
}

.logout-section {
  padding: 30px 15px;
}

.logout-btn {
  height: 44px !important;
  font-size: 16px !important;
}
</style>