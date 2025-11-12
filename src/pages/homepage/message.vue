<template>
  <view class="message-wrapper">
    <!-- 顶部导航栏固定 -->
    <van-config-provider :theme-vars="themeVars">
      <van-nav-bar
        :title="t('messageCenter.title')"
        :left-text="t('messageCenter.back')"
        @click-left="cancel"
        :safe-area-inset-top="true"
        class="nav-fixed"
      />
    </van-config-provider>

    <!-- Tabs 固定在导航栏下方 -->
    <view class="tabs-fixed">
      <van-tabs
        v-model:active="active"
        type="card"
        :color="'#2665AA'"
        background="#ffffff"
        title-active-color="#ffffff"
        title-inactive-color="#000000"
        :line-width="'40px'"
		style="margin-top: 4px;"
      >
        <!-- 🆕 未读消息 -->
        <van-tab :title="t('messageCenter.unreadTab')">
          <scroll-view scroll-y class="message-scroll">
            <view class="message-list">
              <view v-for="(msg, index) in allUnreadMessages" :key="index" class="message-card">
                <view class="message-header">
                  <text class="message-title">{{ msg.title }}</text>
                  <text class="message-time">{{ msg.sendTime }}</text>
                </view>
                <view class="message-content">
                  <text class="message-text">{{ msg.content }}</text>
                </view>
                <view class="message-footer">
                  <text class="message-creator">{{ t('messageCenter.sender') }}：{{ msg.createName }}</text>
                  <text class="read-detail" @click="navigateToDetail(msg.msgRecordId)">{{ t('messageCenter.readDetail') }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </van-tab>

        <!-- 📩 全部消息 -->
        <van-tab :title="t('messageCenter.allTab')">
          <scroll-view scroll-y class="message-scroll">
            <view class="message-list">
              <view v-for="(msg, index) in allMessages" :key="index" class="message-card">
                <view v-if="msg.isRead" class="read-watermark">{{ t('messageCenter.read') }}</view>
                <view class="message-header">
                  <text class="message-title">{{ msg.title }}</text>
                  <text class="message-time">{{ msg.sendTime }}</text>
                </view>
                <view class="message-content">
                  <text class="message-text">{{ msg.content }}</text>
                </view>
                <view class="message-footer">
                  <text class="message-creator">{{ t('messageCenter.sender') }}：{{ msg.createName }}</text>
                  <text class="read-detail" @click="navigateToDetail(msg.msgRecordId)">{{ t('messageCenter.readDetail') }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </van-tab>

        <!-- 📜 系统通知 -->
        <van-tab :title="t('messageCenter.systemTab')">
          <scroll-view scroll-y class="message-scroll">
            <view class="message-list">
              <view v-for="(msg, index) in systemNotifications" :key="index" class="message-card">
                <view class="message-header">
                  <text class="message-title">{{ msg.title }}</text>
                  <text class="message-time">{{ msg.sendTime }}</text>
                </view>
                <view class="message-content">
                  <text class="message-text">{{ msg.content }}</text>
                </view>
                <view class="message-footer">
                  <text class="message-creator">{{ t('messageCenter.sender') }}：{{ msg.createName }}</text>
                  <text class="read-detail" @click="navigateToDetail(msg.msgRecordId)">{{ t('messageCenter.readDetail') }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </van-tab>
      </van-tabs>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useMessageStore } from '@/store/messageStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const messageStore = useMessageStore()
const active = ref(0)

const formatTime = (isoString) => {
  if (!isoString) return ''
  return isoString.replace('T', ' ').substring(0, 16)
}

const allMessages = computed(() =>
  [...messageStore.allMessages]
    .map(msg => ({ ...msg, sendTime: formatTime(msg.sendTime) }))
    .sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime))
)

const allUnreadMessages = computed(() =>
  messageStore.allMessages
    .filter(msg => msg.isRead === false)
    .map(msg => ({ ...msg, sendTime: formatTime(msg.sendTime) }))
    .sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime))
)

// ✅ 加回系统通知
const systemNotifications = computed(() =>
  messageStore.systemNotifications
    .map(msg => ({ ...msg, sendTime: formatTime(msg.sendTime) }))
    .sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime))
)

const navigateToDetail = (msgId) => {
  uni.navigateTo({
    url: `/pages/homepage/msgDtl?msgId=${msgId}`
  })
}

const cancel = () => {
  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/homepage/homepage'
    })
  }, 500)
}

const themeVars = reactive({
  navBarTitleTextColor: '#ffffff',
  navBarTextColor: '#ffffff',
  navBarArrowColor: '#ffffff',
  tabActiveTextColor: '#2665AA',
  tabLineColor: '#2665AA'
})
</script>

<style scoped>
.message-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.nav-fixed {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #2665AA;
}

.tabs-fixed {
  position: sticky;
  top: 46px; /* 根据 van-nav-bar 高度调节 */
  z-index: 999;
  background: #fff;
}

.message-scroll {
  flex: 1;
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.message-list {
  padding: 12px;
}

.message-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.read-watermark {
  position: absolute;
  right: 20px;
  bottom: 20px;
  font-size: 38px;
  color: rgba(0, 0, 0, 0.1);
  transform: rotate(-30deg);
  font-weight: bold;
  pointer-events: none;
  user-select: none;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-content {
  margin-bottom: 12px;
}

.message-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-creator {
  font-size: 12px;
  color: #999;
}

.read-detail {
  font-size: 12px;
  color: #2665AA;
  text-decoration: underline;
}
</style>
