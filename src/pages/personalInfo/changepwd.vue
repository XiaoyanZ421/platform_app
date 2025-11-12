<template>
	<van-config-provider :theme-vars="themeVars">
  <van-nav-bar
    :title="t('changePassword.title')"
  	:left-text="t('changePassword.back')"
  	@click-left="cancel"
	:safe-area-inset-top= "true"
    style="
      background-color: #2665AA;
    "
  />
  </van-config-provider>
  <view class="login">
	<image class="login-bg" src="@/static/images/login/login_bg.png" mode="widthFix"></image>
	<view class="content-wrapper">
    <view class="logo-wrapper">
      <image class="logo" src="@/static/images/login/NewLogoW.png" mode="aspectFit"></image>
    </view>
      <view class="title-container">
		<!-- <view class="sub-title">{{ t('changePassword.platformName') }}</view> -->
        <view class="sub-title">{{ platformName }}</view>
      </view>
      <view class="form">
		  <van-field
              v-model="formState.oriPwd"
              :label="t('changePassword.originalPassword')"
              :placeholder="t('changePassword.enterOriginalPassword')"
              :type="showOriPwd ? 'text' : 'password'"
              input-align="left"
              class="rounded-field"
            >
              <template #right-icon>
                <van-icon
                  :name="showOriPwd ? 'eye-o' : 'closed-eye'"
                  size="20px"
                  color="#999"
                  @click="toggleOriPwd"
                />
              </template>
            </van-field>
			<van-field
			    v-model="formState.newPwd"
			    :label="t('changePassword.newPassword')"
			    :placeholder="t('changePassword.enterNewPassword')"
			    :type="showNewPwd ? 'text' : 'password'"
			    input-align="left"
			    class="rounded-field"
			  >
			    <template #right-icon>
			      <van-icon
			        :name="showNewPwd ? 'eye-o' : 'closed-eye'"
			        size="20px"
			        color="#999"
			        @click="toggleNewPwd"
			      />
			    </template>
			  </van-field>
			  <van-field
			      v-model="formState.veriPwd"
			      :label="t('changePassword.confirmPassword')"
			      :placeholder="t('changePassword.enterConfirmPassword')"
			      :type="showVeriPwd ? 'text' : 'password'"
			      input-align="left"
			      class="rounded-field"
			    >
			    <template #right-icon>
			      <van-icon
			        :name="showVeriPwd ? 'eye-o' : 'closed-eye'"
			        size="20px"
			        color="#999"
			        @click="toggleVeriPwd"
			      />
			    </template>
			    </van-field>

        <view class="button-group" style="margin-top: 20px;">
          <van-button 
            color="#1E59A0"
            @click="goToLogin"
            round
            style="width: 140px; height: 32px; font-size: 14px; color: #fff; border: none; margin-right: 10px;"
          >
            {{ t('changePassword.confirm') }}
          </van-button>
          
          <van-button 
            plain
            @click="cancel"
            round
            style="width: 140px; height: 32px; font-size: 14px; color: #000; background-color: #fff; border: 1px solid #ddd; margin-left: 10px"
          >
            {{ t('changePassword.cancel') }}
          </van-button>
        </view>
      </view>
    </view>
    <view class="tail-container">
      <view class="tail">{{ t('changePassword.copyright') }}</view>
    </view>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useGetPtInfoName } from '@/api/sysinfo';
import { useUpdatePassword } from '@/api/user';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const themeVars = reactive({
  navBarTitleTextColor: '#ffffff',
  navBarTextColor: '#ffffff'
});

const platformName = ref('')
const userName = ref('')
const ptid = ref('')

onMounted(async () => {
  try {
    const res = await useGetPtInfoName()
    if (res.code === 200 && res.success) {
      platformName.value = res.data
    }
  } catch (error) {
    console.error(t('changePassword.getPlatformNameFailed'), error)
  }
  ptid.value = uni.getStorageSync('ptid') || ''
})

// 密码显示状态
const showOriPwd = ref(false)
const showNewPwd = ref(false)
const showVeriPwd = ref(false)

const toggleOriPwd = () => showOriPwd.value = !showOriPwd.value
const toggleNewPwd = () => showNewPwd.value = !showNewPwd.value
const toggleVeriPwd = () => showVeriPwd.value = !showVeriPwd.value

const formState = reactive({
  oriPwd: '',
  newPwd: '',
  veriPwd: ''
})

// 校验规则
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,15}$/
const sqlInjectionRegex = /['";]|--|(\/\*)|(\*\/)/gi

const validatePassword = (password) => {
  password = String(password).trim();
  
  // 防SQL注入检查
  if (sqlInjectionRegex.test(password)) {
    throw new Error(t('changePassword.invalidCharacters'));
  }

  // 密码复杂度校验
  if (!passwordRegex.test(password)) {
    throw new Error(t('changePassword.passwordComplexity'));
  }
  
  return true;
};

const goToLogin = async () => {
  try {
    // 1. 非空校验
    if (!formState.oriPwd || !formState.newPwd || !formState.veriPwd) {
      uni.showToast({ title: t('changePassword.enterCompleteInfo'), icon: 'none' })
      return
    }
    
    // 2. 新密码和确认密码一致性校验
    if (formState.newPwd !== formState.veriPwd) {
      uni.showToast({ title: t('changePassword.passwordNotMatch'), icon: 'none' })
      return
    }
	
	// 3. 原密码和新密码需不一致
	if (formState.newPwd == formState.oriPwd) {
	  uni.showToast({ title: t('changePassword.sameAsOriginal'), icon: 'none' })
	  return
	}
    
    // 4. 密码复杂度校验
    validatePassword(formState.newPwd)
    useUpdatePassword({
      UserId: ptid.value,
      OriginalPassword: formState.oriPwd,
      Password: formState.newPwd
    }).then((res) => {
      if (res.code === 200 && res.success) {
        uni.showToast({
          title: t('changePassword.changeSuccess'),
          icon: 'success'
        })
        
        // 清空表单
        formState.oriPwd = ''
        formState.newPwd = ''
        formState.veriPwd = ''
        
        // 跳转到登录页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          })
        }, 500)
      } else {
        uni.showToast({
          title: res.message || t('changePassword.changeFailed'),
          icon: 'none'
        })
      }
    })
  } catch (error) {
    uni.showToast({
      title: error.message || t('changePassword.networkError'),
      icon: 'none'
    })
  }
}

const cancel = () => {
  formState.oriPwd = ''
  formState.newPwd = ''
  formState.veriPwd = ''
  // 跳转到个人中心页
  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/personalInfo/personalInfo'
    })
  }, 500)
}
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
  margin-bottom: 120px;
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

.rounded-field {
  width: 80% !important;
  margin-top: 20px;
  border-radius: 50px !important;
  overflow: hidden;
  background-color: #fff;
  height: 44px;
}

.rounded-field :deep(.van-field__body) {
  border-radius: inherit;
}

.rounded-field :deep(.van-field__control) {
  font-size: 14px;
  height: 100%;
  padding: 6px 4px;
}

.rounded-field :deep(.van-field__left-icon) {
  margin-right: 4px;
}

.rounded-field :deep(.van-field__right-icon) {
  margin-left: 4px;
}

.forgot-password {
  width: 295px;
  text-align: left;
  font-size: 12px;
  color: #999999; 
  text-decoration: underline;
  margin-top: 6px;
  margin-bottom: 40px;
  cursor: pointer;
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
