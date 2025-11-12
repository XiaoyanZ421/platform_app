<template>
<!-- 整体包裹主题配置 -->
  <van-config-provider :theme-vars="themeVars">
    <view class="factory-app">
      <!-- 顶部栏 -->
      <van-nav-bar
        :title="t('homepage.title')"
        :safe-area-inset-top="true"
        style="background-color: #2665AA;"
      />
      <!-- 顶部背景、语言切换与消息图标 -->
      <view class="header-section">
        <image class="header-bg" src="@/static/images/NewLogoW.png" mode="widthFix" />

        <view class="switch-container">
          <!-- 语言切换按钮 -->
          <view class="i18n">
            <van-button
              :type="currentLang === 'en' ? 'primary' : 'default'"
              size="small"
              class="lang-btn"
              @click="switchLanguage('en')"
            >
              EN
            </van-button>
            <van-button
              :type="currentLang === 'zh' ? 'primary' : 'default'"
              size="small"
              class="lang-btn"
              @click="switchLanguage('zh')"
            >
              中
            </van-button>
          </view>

          <!-- 消息图标 -->
          <view class="message-icon">
            <van-icon
              size="32"
              name="bulb-o"
              :badge="unreadCount > 0 ? unreadCount : ''"
              max="99"
              :offset="[-6, 6]"
              color="#ffffff"
              @click="goToMessage"
            />
          </view>
        </view>
      </view>
	
	<!-- 轮播图片 -->
	<view class="swipe-container">
	  <swiper 
	    class="my-swipe" 
	    :autoplay="3000" 
	    indicator-color="white"
	    indicator-dots
	  >
	    <swiper-item 
	      v-for="(item, index) in swipeItems" 
	      :key="index"
	      @click="handleSwipeClick(item.path)"
	    >
	      <image 
	        class="swipe-image" 
	        :src="item.image" 
	        mode="aspectFill" 
	        @error="handleImageError(index)"
	      />
	      <text class="swipe-title">{{ t(item.title) }}</text>
	    </swiper-item>
	  </swiper>
	</view>
	
	<view class="notice-bar">
	  <view 
	      v-if="showNotice"
	      class="custom-notice-bar" 
	      :style="{background: 'linear-gradient(to right, #CEE7FA, #ffffff)'}"
		  @click="goToMessage"
	    >
	      <view class="notice-container">
	        <view class="notice-icon">
	          <van-icon name="bulb-o" size="24px" color="#666666" />
	        </view>
	        
	        <view class="notice-content">
	          <view v-if="unreadCount > 0" class="notice-swipe">
	            <swiper 
	              vertical 
	              :autoplay="true" 
	              :interval="3000" 
	              :duration="500"
	              :circular="true"
	              class="notice-swipe"
	              :touchable="false"
	              :indicator-dots="false"
	            >
	              <swiper-item v-for="(msg, index) in latestUnreadMessages" :key="index">
	                <view class="notice-text">{{ msg }}</view>
	              </swiper-item>
	            </swiper>
	          </view>
	          <view v-else class="notice-text">
	            {{ t('homepage.noNotice') }}
	          </view>
	        </view>
	        
	        <view class="notice-close">
	          <van-icon name="cross" size="32rpx" color="#666666" @click="handleCloseNotice" />
	        </view>
	      </view>
	    </view>
	</view>
	
    <!-- 功能图标网格 -->
    <view class="function-swipe-container">
      <swiper 
        class="function-swipe" 
        :indicator-dots="false"
        :autoplay="false"
        @change="onFunctionSwiperChange"
        :current="currentFunctionPage"
        v-if="chunkedFunctionList && chunkedFunctionList.length > 0"
      >
        <swiper-item 
          v-for="(page, pageIndex) in chunkedFunctionList" 
          :key="pageIndex"
        >
          <view class="function-grid">
            <view 
              v-for="item in page" 
              :key="item.key"
              class="function-item"
              @click="handleFunctionClick(item.key)"
            >
              <view class="icon-wrapper">
                <image :src="item.icon" mode="aspectFit"></image>
              </view>
              <text class="function-text">
                {{ currentLang === 'zh' ? item.functionName : item.englishName }}
              </text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>
	
	<!-- 运行数据图表区域 -->
	<view class="charts">
	  <view class="charts-title">{{ t(chartData.title) }}</view>
	  <view class="charts-grid">
	    <!-- 设备接入类型 -->
	    <view class="chart" v-for="(item, index) in chartData.items" :key="index">
	      <view class="chart-title">{{ t(item.title) }}</view>
	      <view class="chart-content">
	        <view class="ring">
	          <view class="ring-bg" :class="`ring-${index + 1}`">
	            <view class="ring-inner">
	            </view>
	          </view>
	        </view>
	        <view class="legend">
	          <view class="legend-item" v-for="legend in item.legend" :key="legend.name">
	            <view class="legend-color" :style="{ backgroundColor: legend.color }"></view>
	            <text class="legend-text">{{ t(legend.name) }} {{ legend.value }}({{ legend.percent }}%)</text>
	          </view>
	        </view>
	      </view>
	    </view>
	  </view>
	</view>
	
  </view>
  
  </van-config-provider>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useMessageStore } from '@/store/messageStore.ts'
import { connectSignalR, setWebSocketActive, checkConnectionStatus, restartConnection } from '@/utils/nativeWebSocket.js'
import { onShow, onHide } from '@dcloudio/uni-app'
import { useGetPermissionBySysCode, useGetAllSysInfo, useGetAllMSys} from '@/api/sysinfo'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 当前语言
const currentLang = ref(locale.value)

// 切换语言
const switchLanguage = (lang) => {
  currentLang.value = lang
  locale.value = lang
  uni.setStorageSync('lang', lang)
}

const messageStore = useMessageStore()
const signalRConnected = ref(false)
const showNotice = ref(true)

const ptid = ref('')
const sub = ref('')

const unreadCount = computed(() => messageStore.unreadCount)
const latestUnreadMessages = computed(() => messageStore.latestUnreadMessages)

const mobileSysPerm = ref('')

// 连接状态相关
const connectionStatus = ref('disconnected') // disconnected, connecting, connected, reconnecting
const connectionCheckInterval = ref(null)

// 计算连接状态显示
const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'status-connected'
    case 'connecting': return 'status-connecting'
    case 'reconnecting': return 'status-reconnecting'
    default: return 'status-disconnected'
  }
})

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'success'
    case 'connecting': return 'clock'
    case 'reconnecting': return 'replay'
    default: return 'warning'
  }
})

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return t('homepage.connected')
    case 'connecting': return t('homepage.connecting')
    case 'reconnecting': return t('homepage.reconnecting')
    default: return t('homepage.disconnected')
  }
})

// 获取移动端系统权限函数
const fetchPermission = async () => {
  try {
    const res = await useGetPermissionBySysCode({userId: uni.getStorageSync('ptid'), syscode: "meeting"})
    if (res.code === 200 && res.success) {
      mobileSysPerm.value = res.data
    } else {
      console.error('获取移动端系统权限失败:', res.message)
    }
  } catch (error) {
    console.error('调用useGetPermissionBySysCode接口失败:', error)
  }
}

// 手动刷新消息
const refreshMessages = () => {
  initSignalRConnection()
}

const goToMessage = () => {
  uni.navigateTo({
    url: '/pages/homepage/message'
  });
};

// 添加图片加载错误处理
const handleImageError = (index) => {
  console.error(`图片加载失败: ${swipeItems.value[index].image}`)
}

const themeVars = reactive({
  navBarTitleTextColor: '#ffffff'
});

const handleFunctionClick = (functionCode) => {
  let routePath = ''
  routePath = `/pages/homepage/sample_funcGrid?code=${functionCode}`
  
  uni.navigateTo({
    url: routePath
  })
}
  
// 轮播数据配置
const swipeItems = ref([
  {
    title: 'homepage.swipe1',
    image: '/static/images/homepage/swipe1.png',
    path: '/pages/editVisit'
  },
  {
    title: 'homepage.swipe2',
    image: '/static/images/homepage/swipe2.png',
    path: '/pages/addVisit'
  }
])

// 轮播项点击处理
const handleSwipeClick = (path) => {
  uni.navigateTo({
    url: path
  })
}

// 功能列表数据
const functionList = computed(() => {
  if (!mobileSysPerm.value || !mobileSysPerm.value.menuDtos) {
    return []
  }
  
  return mobileSysPerm.value.menuDtos.map(item => ({
    key: item.functionCode,
    functionName: item.functionName,
    englishName: item.functionCode,
    icon: `/static/icons/homepage/${item.icon}.png` || '/static/icons/homepage/10.png'
  }))
})

// 修复 chunkedFunctionList 计算属性
const chunkedFunctionList = computed(() => {
  try {
    if (!functionList.value || functionList.value.length === 0) {
      return []
    }
    
    const chunkSize = 10
    const chunks = []
    
    for (let i = 0; i < functionList.value.length; i += chunkSize) {
      chunks.push(functionList.value.slice(i, i + chunkSize))
    }
    
    return chunks
  } catch (error) {
    console.error('分页处理错误:', error)
    return []
  }
})

// 添加当前功能页状态
const currentFunctionPage = ref(0)

// 监听轮播图变化
const onFunctionSwiperChange = (e) => {
  currentFunctionPage.value = e.detail.current
}

// 关闭通知栏
const handleCloseNotice = () => {
  showNotice.value = false
}

// 更新连接状态检查
const updateConnectionStatus = () => {
  const status = checkConnectionStatus()
  if (status.isConnected) {
    connectionStatus.value = 'connected'
    signalRConnected.value = true
  } else if (status.isConnecting) {
    connectionStatus.value = 'connecting'
  } else {
    connectionStatus.value = 'disconnected'
    signalRConnected.value = false
  }
}

// 修改 SignalR 连接初始化
const initSignalRConnection = async () => {
  try {
    connectionStatus.value = 'connecting'
    await connectSignalR()
    connectionStatus.value = 'connected'
    signalRConnected.value = true
  } catch (error) {
    console.error('❌ SignalR 连接失败:', error)
    connectionStatus.value = 'reconnecting'
    signalRConnected.value = false
    
    if (!error.message.includes('timeout')) {
      uni.showToast({
        title: '正在连接实时消息...',
        icon: 'none',
        duration: 2000
      })
    }
  }
}

// 颜色配置
const chartColors = {
  blue1: '#358DF6',
  blue2: '#7AC4FF',
  blue3: '#688BFF',
  blue4: '#BFD5FF',
  green: '#358DF6',
  orange: '#FFD643',
  red: '#F8963D',
  darkOrange: '#F04F4F'
}

// 运行数据配置
const chartData = reactive({
  title: 'homepage.runningData',
  items: [
    {
      title: 'homepage.deviceAccessType',
      percentage: 25,
      ringLabel: 'homepage.directDevice',
      legend: [
        { name: 'homepage.directDevice', value: '2.5W', percent: 25, color: '#358DF6' },
        { name: 'homepage.gateway', value: '1,491', percent: 62, color: '#BFD5FF' },
        { name: 'homepage.subDevice', value: '2,215', percent: 20, color: '#7AC4FF' }
      ]
    },
    {
      title: 'homepage.deviceOnlineRate',
      percentage: 25,
      ringLabel: 'homepage.onlineDevice',
      legend: [
        { name: 'homepage.onlineDevice', value: '2.5W', percent: 25, color: '#358DF6' },
        { name: 'homepage.offlineDevice', value: '1,491', percent: 62, color: '#7AC4FF' }
      ]
    },
    {
      title: 'homepage.deviceActivityRate',
      percentage: 25,
      ringLabel: 'homepage.within5Minutes',
      legend: [
        { name: 'homepage.within5Minutes', value: '1,300', percent: 25, color: '#358DF6' },
        { name: 'homepage.within1Hour', value: '2,234', percent: 23, color: '#7AC4FF' },
        { name: 'homepage.within1Day', value: '4,652', percent: 31, color: '#688BFF' },
        { name: 'homepage.over1Day', value: '5,832', percent: 30, color: '#BFD5FF' }
      ]
    },
    {
      title: 'homepage.deviceAlarmRate',
      percentage: 80,
      ringLabel: 'homepage.normal',
      legend: [
        { name: 'homepage.normal', value: '1.1W', percent: 80, color: '#358DF6' },
        { name: 'homepage.generalAlarm', value: '236', percent: 20, color: '#FFD643' },
        { name: 'homepage.importantAlarm', value: '12', percent: 15, color: '#F8963D' },
        { name: 'homepage.urgentAlarm', value: '2', percent: 0.1, color: '#F04F4F' }
      ]
    }
  ]
})

// 页面生命周期
onMounted(() => {
  console.log(uni.getStorageSync('ptid'))
  console.log(uni.getStorageSync('access_token'))
  fetchPermission()
  
  // 启动连接状态检查定时器
  connectionCheckInterval.value = setInterval(updateConnectionStatus, 2000)
  
  // 延迟连接，确保用户信息加载完成
  setTimeout(() => {
    const userId = uni.getStorageSync('userId')
    if (userId) {
      initSignalRConnection()
    }
  }, 1500)
})

// 页面显示时激活WebSocket连接
onShow(() => {
  setWebSocketActive(true)
  updateConnectionStatus()
  
  if (!signalRConnected.value) {
    initSignalRConnection()
  }
})

// 页面隐藏时暂停WebSocket重连
onHide(() => {
  setWebSocketActive(false)
})

// 页面卸载时清理资源
onUnmounted(() => {
  if (connectionCheckInterval.value) {
    clearInterval(connectionCheckInterval.value)
    connectionCheckInterval.value = null
  }
})

</script>

<style scoped>
.factory-app {
  min-height: 100vh;
  background: linear-gradient(to bottom, 
    #2665AA 0%,
    #ffffff 30%,
    #ffffff 30%,
    #ffffff 100%
  );
}

.switch-container {
  justify-content: flex-end;
  display: flex;
  margin-right: 8px;
  border-radius: 8px;
}

.i18n {
  display: inline-flex;
  background-color: #DBE8FD;
  border-radius: 6px;
  margin-top: 8px;
  padding: 2px 2px; 
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.lang-btn {
  font-size: 12px;
  font-weight: 600;
  color: #323233;
  width: 30px;
  background-color: #DBE8FD;
  height: 28px;
  transition: all 0.3s ease;
}

/* 选中状态的样式 */
.lang-btn.van-button--primary {
  background: #3D8AD7;
  color: #ffffff;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.message-icon{
  justify-content: flex-end;
  margin-top: 8px;
  margin-left: 8px;
}
/* 默认状态的样式 */
.lang-btn.van-button--default {
  background: ##DBE8FD;
  color: #323233;
}

/* 移除vant按钮的默认阴影 */
.lang-btn::after {
  display: none;
}

/* 头部区域 */
.header-section {
  position: relative;
}

.header-bg {
  width: 162px;
  height: 42px;
  position: absolute;
  top: 0;
  left: 0;
  margin-top: 8px;
  margin-left: 8px;
}
/* 轮播容器 */
.swipe-container {
  height: 140px;
  margin: 12px 16px 12px 16px;
  border-radius: 8px;
  overflow: hidden;
}

/* 轮播图片 */
.swipe-image {
  width: 100%;
  height: 100%;
  display: block;
}

/* 轮播标题 */
.swipe-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 15px;
  color: white;
  background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
  font-size: 16px;
}

.notice-swipe {
  height: 40px;
  line-height: 40px;
}
  
/* 消息通知 */ 
.notice-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.notice-icon {
  flex-shrink: 0;
  margin-right: 12px;
}

.notice-content {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.notice-close {
  flex-shrink: 0;
  margin-left: 20rpx;
}

/* 其他原有样式保持不变 */
.notice-bar {
  border-radius: 12px;
  overflow: hidden;
  margin: 0 16px 16px 16px;
}

.custom-notice-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
}

.notice-swipe {
  height: 40rpx;
  line-height: 40rpx;
}

.notice-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 40rpx;
}

/* 功能轮播容器 */
.function-swipe-container {
  margin: 12px 16px;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.function-swipe {
  height: 360rpx;
  width: 100%;
}

/* 功能网格 */
.function-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  padding: 15px;
  height: 100%;
}

/* 功能项 */
.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  min-width: 0; /* 防止内容溢出 */
  background: #fff;
  border-radius: 12px;
  transition: transform 0.2s;
}

.function-item:active {
  transform: scale(0.95);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.function-text {
  font-size: 10px;
  color: #333;
  text-align: center;
  line-height: 1.2;
}

/* 运行数据图表区域样式 */
.charts-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  margin-left: 16px;
}

.charts-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 12px 16px;
  grid-template-columns: 1fr;
}

/* 每行两个卡片 - 确保高度一致 */
.chart {
  width: calc(50% - 4px);
  background: #fff;
  border-radius: 16px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 200px; /* 添加最小高度确保卡片高度一致 */
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.15);
  margin-bottom: 6px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
  height: 24px; /* 固定标题高度 */
}

/* 环在左，label在右 - 使用flex-start对齐 */
.chart-content {
  display: flex;
  align-items: flex-start; /* 改为flex-start确保顶部对齐 */
  justify-content: space-between;
  flex: 1; /* 占据剩余空间 */
  min-height: 120px; /* 固定内容区域高度 */
  flex-direction: row;
  text-align: center;
  gap: 12px;
}  

/* 环形图容器 */
.ring {
  width: 60px;
  height: 60px;
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f5f5f5;
}

.ring-bg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
}

/* 内环 */
.ring-inner {
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
}

.ring-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.ring-label {
  font-size: 11px;
  color: #888;
  line-height: 1.2;
  margin-top: 2px;
}

/* 图例区域 - 调整字体大小 */
.legend {
  flex: 1;
  margin-left: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 12px;
  color: #333;
  text-align: left;
}

/* 环颜色配置 */
.ring-1 {
  background: conic-gradient(
    #2665AA 0deg 90deg,
    #7AC4FF 90deg 180deg, 
    #BFD5FF 180deg 270deg
  );
}

.ring-2 {
  background: conic-gradient(
    #2665AA 0deg 90deg,
    #7AC4FF 90deg 180deg
  );
}

.ring-3 {
  background: conic-gradient(
    #2665AA 0deg 72deg,
    #7AC4FF 72deg 144deg,
    #688BFF 144deg 216deg, 
    #BFD5FF 216deg 288deg
  );
}

.ring-4 {
  background: conic-gradient(
    #358DF6 0deg 288deg,
    #FFD643 288deg 324deg,
    #F8963D 324deg 342deg,
    #F04F4F 342deg 360deg
  );
}

/* 响应式适配 */
@media (max-width: 375px) {  
  .data-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .lang-btn {
    min-width: 70px;
    font-size: 12px;
  }
  
  .ring {
    width: 70px;
    height: 70px;
  }
  
  .ring-inner {
    width: 45px;
    height: 45px;
  }
  
  .ring-value {
    font-size: 12px;
  }
  
  .ring-label {
    font-size: 10px;
  }
  
  .legend {
    width: 100%;
    margin-left: 0;
    align-items: center;
  }
}
</style>