<template> 
  <view class="login">
    <image class="login-bg" src="@/static/images/login/login_bg.png" mode="widthFix"></image>
    <view class="content-wrapper">
      <view class="logo-wrapper">
        <image class="logo" src="@/static/images/login/NewLogoW.png" mode="aspectFit"></image>
      </view>
      <view class="title-container">
        <!-- <view class="sub-title">{{ t('login.platformName') }}</view> -->
		<view class="sub-title">{{ platformName }}</view>
      </view>
      
      <view style="color: #999; text-align: center; font-size: 22px; margin-bottom: 20px">
        {{ t('login.welcome') }}
      </view>
      
      <view class="form">
        <view class="input-wrapper">
          <view class="input-container">
            <van-icon name="manager" size="20px" color="#999" />
            <input
              v-model="formState.username"
              :placeholder="t('login.usernamePlaceholder')"
              class="custom-input"
              placeholder-class="placeholder"
              :disabled="isLoading"
            />
          </view>
        </view>
        
        <view class="input-wrapper">
          <view class="input-container">
            <van-icon name="lock" size="20px" color="#999" />
            <input
              v-model="formState.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('login.passwordPlaceholder')"
              class="custom-input"
              placeholder-class="placeholder"
              :disabled="isLoading"
            />
            <van-icon
              :name="showPassword ? 'eye-o' : 'closed-eye'"
              size="20px"
              color="#999"
              @click="togglePassword"
              :disabled="isLoading"
            />
          </view>
        </view>
        
        <van-button 
          color="linear-gradient(to right, #1E59A0, #62B0F5)"
          @click="onLogin"
          round
          :loading="isLoading"
          :disabled="isLoading"
          :loading-text="t('login.loadingText')"
          style="width: 295px; height: 40px; font-size: 14px; margin-top: 50px;"
        >
          {{ isLoading ? t('login.loadingText') : t('login.submit') }}
        </van-button>
        
        <view v-if="isLoading" class="loading-tip">
          {{ t('login.loadingTip') }}
        </view>
      </view>
    </view>
    
    <view class="tail-container">
      <view class="tail">{{ t('login.copyright') }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import CryptoJS from 'crypto-js'
import { usePassWordLogin } from '@/api/user'
import { useGetPtInfoName } from '@/api/sysinfo'
import { TextDecoder } from 'text-encoding'
import { useI18n } from 'vue-i18n'

const { t } = useI18n() // ✅ 引入国际化

const loginData = {
  ClientId: 'znpt',
  ClientSecret: 'secret',
  RememberLogin: false,
  LoginName: '',
  Password: '',
  IsMobileSSO: false
}

const platformName = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const formState = reactive({ username: '', password: '' })

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 校验规则
const usernameRegex = /^[a-zA-Z0-9_-]{5,20}$/
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,15}$/
const sqlInjectionRegex = /['";]|--|(\/\*)|(\*\/)/gi

const validateInput = (input, type) => {
  input = String(input).trim()
  if (sqlInjectionRegex.test(input)) throw new Error(t('login.invalidInput'))
  if (type === 'username' && !usernameRegex.test(input)) throw new Error(t('login.invalidCredentials'))
  if (type === 'password' && !passwordRegex.test(input)) throw new Error(t('login.invalidCredentials'))
}

const onLogin = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    if (!formState.username || !formState.password) {
      uni.showToast({ title: t('login.enterBoth'), icon: 'none' })
      return
    }
    validateInput(formState.username, 'username')
    validateInput(formState.password, 'password')

    const key = CryptoJS.enc.Utf8.parse('1234567890abcdef')
    const iv = CryptoJS.enc.Utf8.parse('1234567890abcdef')
    const encrypted = CryptoJS.AES.encrypt(formState.password, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    loginData.Password = encrypted.toString()
    loginData.LoginName = formState.username.trim()
    await loginFun(loginData)
  } catch (error) {
    uni.showToast({ title: error.message || t('login.networkError'), icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const loginFun = async (loginData) => {
  try {
    const res = await usePassWordLogin(loginData)
    if (res.code === 200 && res.success) {
      const access_token = res.data.access_token
      if (!access_token) throw new Error(t('login.emptyToken'))
      const tokenParts = access_token.split('.')
      if (tokenParts.length !== 3) throw new Error(t('login.tokenError'))
      const statement = JSON.parse(
        new TextDecoder('utf-8').decode(
          Uint8Array.from(
            atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')),
            (c) => c.charCodeAt(0)
          )
        )
      )
      if (typeof statement.role === 'string') statement.role = [statement.role]
      await Promise.all([
        setStoragePromise('userId', statement.sub),
        setStoragePromise('ptid', statement.ptid),
        setStoragePromise('code', statement.code),
        setStoragePromise('userName', statement.realname),
        setStoragePromise('access_token', access_token),
        setStoragePromise('refresh_token', res.data.refresh_token),
        setStoragePromise('expires_in', res.data.expires_in)
      ])
      uni.reLaunch({ url: '/pages/homepage/homepage' })
    } else {
      uni.showToast({ title: res.message || t('login.failed'), icon: 'none' })
    }
  } catch (error) {
    throw error
  }
}

const setStoragePromise = (key, data) => {
  return new Promise((resolve, reject) => {
    uni.setStorage({ key, data, success: resolve, fail: reject })
  })
}

onMounted(async () => {
  try {
    await nextTick()
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('refresh_token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('ptid')
    const res = await useGetPtInfoName()
    if (res.code === 200 && res.success) {
      platformName.value = res.data
    }
  } catch (error) {
    console.error('初始化失败:', error)
  }
})
</script>

<style scoped>
.login {
  position: relative; /* 确保子元素绝对定位相对于这个容器 */
  width: 100%;
  min-height: 100vh;
  background-color: #f5f9ff;
  z-index: 1;
}

.login-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 291px;
  object-fit: cover;
  z-index: 0;
}
.content-wrapper {
  position: relative;
  z-index: 2; /* 确保在背景图之上 */
  padding-top: 40px; /* 给背景图留出空间 */
}
.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.logo {
  width: 249px;
  height: 44px;
  margin: 60px 0 20px 0;
}

.title-container {
  text-align: center;
  margin-bottom: 100px;
  z-index: 2;
}

.sub-title {
  font-size: 21px;
  font-weight: bold;
  color: #ffffff;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-wrapper {
  margin-bottom: 20px;
  width: 300px;
}

.input-container {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 10px 15px;
  border: 1px solid #eee;
  height: 36px;
}

.custom-input {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
  height: 20px;
  line-height: 20px;
}

.placeholder {
  color: #999;
  font-size: 14px;
}

.tail-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom); /* 适配iOS安全区域 */
  background-color: #f5f9ff; /* 与页面背景色一致 */
  z-index: 1;
}

.tail {
  text-align: center;
  font-size: 14px;
  color: #999;
  padding: 24px 0;
  margin: 0;
}
</style>
