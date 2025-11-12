<template>
	<view class="msg-detail-page">
    <van-config-provider :theme-vars="themeVars">
      <van-nav-bar
        title="功能示例"
        left-text="< 返回"
        @click-left="cancel"
        :safe-area-inset-top="true"
        style="background-color: #2665AA;"
      />
    </van-config-provider>

    <!-- 运行数据图表区域 -->
    <view class="charts-container">
      <view class="charts-title">运行数据</view>
      <view class="charts-grid">
        <!-- 设备接入类型 -->
        <view class="chart-card">
          <view class="chart-header">设备接入类型</view>
          <view class="chart-content">
            <view class="chart-ring">
              <view class="ring-bg ring-type-1">
                <view class="ring-inner">
                  <text class="ring-value">25%</text>
                  <text class="ring-label">直连设备</text>
                </view>
              </view>
            </view>
            <view class="chart-legend">
              <view class="legend-item">
                <view class="legend-color legend-blue"></view>
                <text class="legend-text">直连设备 2.5W (25%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-green"></view>
                <text class="legend-text">网关 1,491 (62%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-orange"></view>
                <text class="legend-text">子设备 2,215 (20%)</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 设备在线率 -->
        <view class="chart-card">
          <view class="chart-header">设备在线率</view>
          <view class="chart-content">
            <view class="chart-ring">
              <view class="ring-bg ring-type-2">
                <view class="ring-inner">
                  <text class="ring-value">25%</text>
                  <text class="ring-label">在线设备</text>
                </view>
              </view>
            </view>
            <view class="chart-legend">
              <view class="legend-item">
                <view class="legend-color legend-blue"></view>
                <text class="legend-text">在线设备 2.5W (25%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-orange"></view>
                <text class="legend-text">离线设备 1,491 (62%)</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 设备活跃率 -->
        <view class="chart-card">
          <view class="chart-header">设备活跃率</view>
          <view class="chart-content">
            <view class="chart-ring">
              <view class="ring-bg ring-type-3">
                <view class="ring-inner">
                  <text class="ring-value">25%</text>
                  <text class="ring-label">5分钟内</text>
                </view>
              </view>
            </view>
            <view class="chart-legend">
              <view class="legend-item">
                <view class="legend-color legend-blue"></view>
                <text class="legend-text">5分钟内 1,300 (25%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-green"></view>
                <text class="legend-text">1小时内 2,234 (23%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-orange"></view>
                <text class="legend-text">1天内 4,652 (31%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-purple"></view>
                <text class="legend-text">1天以上 5,832 (30%)</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 设备告警率 -->
        <view class="chart-card">
          <view class="chart-header">设备告警率</view>
          <view class="chart-content">
            <view class="chart-ring">
              <view class="ring-bg ring-type-4">
                <view class="ring-inner">
                  <text class="ring-value">80%</text>
                  <text class="ring-label">正常</text>
                </view>
              </view>
            </view>
            <view class="chart-legend">
              <view class="legend-item">
                <view class="legend-color legend-green"></view>
                <text class="legend-text">正常 1.1W (80%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-orange"></view>
                <text class="legend-text">普通告警 236 (20%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-red"></view>
                <text class="legend-text">重要告警 12 (15%)</text>
              </view>
              <view class="legend-item">
                <view class="legend-color legend-dark-red"></view>
                <text class="legend-text">紧急告警 2 (0.1%)</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 主题变量
const themeVars = reactive({
  navBarTitleTextColor: '#ffffff',
  navBarTextColor: '#ffffff',
  navBarArrowColor: '#ffffff',
})

// 返回按钮
const cancel = () => {
  uni.navigateBack()
}

// 页面加载
onLoad(() => {
  console.log('功能示例页面加载')
})
</script>

<style scoped>
.msg-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 图表容器 */
.charts-container {
  padding: 20px;
  background: #fff;
  margin: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.charts-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 图表卡片 */
.chart-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.chart-header {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  text-align: center;
  margin-bottom: 12px;
}

.chart-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 环形图样式 */
.chart-ring {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 12px;
}

.ring-bg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.ring-bg::before {
  content: '';
  position: absolute;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: #fff;
}

.ring-inner {
  position: relative;
  z-index: 2;
  text-align: center;
}

.ring-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #2665AA;
  line-height: 1.2;
}

.ring-label {
  display: block;
  font-size: 12px;
  color: #666;
  line-height: 1.2;
}

/* 图例样式 */
.chart-legend {
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-text {
  color: #666;
  font-size: 11px;
  line-height: 1.2;
}

/* 颜色定义 */
.legend-blue {
  background-color: #2665AA;
}

.legend-green {
  background-color: #4CAF50;
}

.legend-orange {
  background-color: #FF9800;
}

.legend-purple {
  background-color: #9C27B0;
}

.legend-red {
  background-color: #FF5722;
}

.legend-dark-red {
  background-color: #F44336;
}

/* 环形图背景样式 */
.ring-type-1 {
  background: conic-gradient(#2665AA 25%, #4CAF50 25% 87%, #FF9800 87%);
}

.ring-type-2 {
  background: conic-gradient(#2665AA 25%, #FF9800 25%);
}

.ring-type-3 {
  background: conic-gradient(#2665AA 25%, #4CAF50 25% 48%, #FF9800 48% 79%, #9C27B0 79%);
}

.ring-type-4 {
  background: conic-gradient(#4CAF50 80%, #FF9800 80% 95%, #FF5722 95% 99.9%, #F44336 99.9%);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .chart-ring {
    width: 80px;
    height: 80px;
  }
  
  .ring-value {
    font-size: 14px;
  }
  
  .ring-label {
    font-size: 11px;
  }
}
</style>