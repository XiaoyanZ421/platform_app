<template>
	<view class="msg-detail-page">
  <van-config-provider :theme-vars="themeVars">
    <van-nav-bar
      :title="t('messageDetail.title')"
      :left-text="t('messageDetail.back')"
      @click-left="cancel"
      :safe-area-inset-top="true"
      style="background-color: #2665AA;"
    />
  </van-config-provider>

  <view class="msg-detail-container">
    <!-- 加载状态 -->
    <van-loading v-if="loading" size="24px" vertical>{{ t('messageDetail.loading') }}</van-loading>
    
    <!-- 错误状态 -->
    <view v-else-if="error" class="error-message">
      <van-icon name="warning-o" size="24px" />
      <text>{{ t('messageDetail.loadFailed') }}</text>
    </view>
    
    <!-- 正常显示 -->
    <view v-else-if="message" class="message-content">
      <!-- 创建人和时间 -->
      <view class="message-meta">
        <text class="creator">{{ message.createName }}</text>
        <text class="time">{{ formatTime(message.createTime) }}</text>
      </view>
      
      <!-- 消息标题 -->
      <view class="message-title">
        <text>{{ message.title }}</text>
      </view>
      
      <!-- 消息内容 -->
      <view class="message-body">
        <text>{{ message.content }}</text>
      </view>
      
      <!-- 其他信息 -->
      <view class="message-footer">
        <text v-if="message.sendUser" class="footer-item">{{ t('messageDetail.sender') }}: {{ message.sendUser }}</text>
        <text v-if="message.sendTime" class="footer-item">{{ t('messageDetail.sendTime') }}: {{ formatTime(message.sendTime) }}</text>
        <text v-if="message.isRead" class="footer-item">{{ t('messageDetail.readTime') }}: {{ formatTime(message.msgReadTime) }}</text>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-else class="empty-message">
      <van-icon name="info-o" size="24px" />
      <text>{{ t('messageDetail.notFound') }}</text>
    </view>
  </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { GetMsgDetail, ReaMsgdpi } from '@/api/user.ts'
import { useMessageStore } from '@/store/messageStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const messageStore = useMessageStore()
const msgId = ref('')
// 状态管理
const loading = ref(true)
const error = ref(false)
const message = ref(null)

// 主题变量
const themeVars = reactive({
  navBarTitleTextColor: '#ffffff',
  navBarTextColor: '#ffffff',
  navBarArrowColor: '#ffffff',
})

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return ''
  try {
    const date = new Date(timeString)
    return date.toLocaleString()
  } catch (e) {
    return timeString
  }
}

//标记为已读
const markMessageAsRead = async () => {
  try {
    const res = await ReaMsgdpi({ msgId: msgId.value })
    console.log('🟢 标记已读接口返回：', res)

    if (res.code === 200 && res.success) {
      console.log('✅ 消息已标记为已读')
	  messageStore.markAsRead(msgId.value)
	   uni.$emit('refreshMessages')
    } else {
      uni.showToast({
        title: res.message || t('messageDetail.markReadFailed'),
        icon: 'none'
      })
    }
  } catch (err) {
    console.error('标记消息为已读接口出错:', err)
    uni.showToast({
      title: t('messageDetail.networkError'),
      icon: 'none'
    })
  }
}

// 获取消息详情
const fetchMessageDetail = async () => {
  try {
    loading.value = true
    error.value = false
    const res = await GetMsgDetail({ msgId: msgId.value })
	console.log("GetMsgDetail", res)
    if (res.code === 200 && res.data) {
      message.value = res.data
      // 只有当消息未读时才调用标记为已读
      if (res.data.isRead === false) {
        await markMessageAsRead()
      }
    } else {
      error.value = true
      uni.showToast({
        title: res.message || t('messageDetail.getDetailFailed'),
        icon: 'none'
      })
    }
  } catch (err) {
    console.error('获取消息详情出错:', err)
    error.value = true
    uni.showToast({
      title: t('messageDetail.networkError'),
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取消息ID
onLoad((options) => {
  if (options.msgId) {
    msgId.value = options.msgId
    fetchMessageDetail()
  }
})

// 返回按钮
const cancel = () => {
  uni.navigateBack() // 直接返回上一页，这样 message.vue 的 onShow 会自动触发
}
</script>

<style scoped>
.msg-detail-container {
  padding: 16px;
  min-height: calc(100vh - 46px); /* 减去导航栏高度 */
  background-color: #f5f7fa;
}

/* 加载状态 */
.van-loading {
  padding-top: 100px;
}

/* 错误状态 */
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
  color: #f44;
}

.error-message text {
  margin-top: 8px;
}

/* 空状态 */
.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
  color: #969799;
}

.empty-message text {
  margin-top: 8px;
}

/* 消息内容区域 */
.message-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 创建人和时间 */
.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.message-meta .creator {
  font-size: 14px;
  color: #666;
}

.message-meta .time {
  font-size: 12px;
  color: #999;
}

/* 消息标题 */
.message-title {
  margin: 16px 0;
}

.message-title text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

/* 消息正文 */
.message-body {
  margin: 16px 0;
  line-height: 1.6;
}

.message-body text {
  font-size: 15px;
  color: #333;
}

/* 页脚信息 */
.message-footer {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-item {
  font-size: 12px;
  color: #999;
}
</style>