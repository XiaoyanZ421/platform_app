// 在文件最顶部立即设置 require Polyfill
(function() {
  // #ifdef APP-PLUS
  if (typeof require === 'undefined') {
    // 兼容不同环境的全局对象
    const globalObj = typeof global !== 'undefined' ? global : 
                     typeof window !== 'undefined' ? window : 
                     typeof self !== 'undefined' ? self : {};
    
    globalObj.require = function() {
      return {}
    }
    
    // 同时设置 module 和 exports 避免相关错误
    if (typeof module === 'undefined') {
      globalObj.module = { exports: {} }
    }
    if (typeof exports === 'undefined') {
      globalObj.exports = {}
    }
  }
  // #endif
})();

// 现在导入 SignalR
import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr'
import { getNoReadMsgApi, getAllMsgApi } from '@/api/user.ts'
import { useSignalRstore } from '@/store/signalRstore.js'
import { useMessageStore } from '@/store/messageStore.ts'

// 全局连接实例
let globalConnection = null
let isConnecting = false
let reconnectTimer = null

/**
 * 彻底重写 WebSocket Polyfill
 */
function overrideWebSocketGlobally() {
  // #ifdef APP-PLUS
  if (typeof window === 'undefined') return
  
  // 如果已经有 WebSocket 实现，先备份
  if (window.WebSocket) {
    window.OriginalWebSocket = window.WebSocket
  }
  
  window.WebSocket = function(url, protocols) {
    this.url = url
    this.readyState = 0 // CONNECTING
    this.binaryType = 'arraybuffer'
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    
    try {
      // 使用 uni-app 的 WebSocket
      this.socketTask = uni.connectSocket({
        url: url,
        protocols: Array.isArray(protocols) ? protocols : []
      })
      
      // 使用全局事件监听（最兼容的方式）
      this._bindGlobalEvents()
      
    } catch (error) {
      console.error('❌ WebSocket 初始化失败:', error)
      this.readyState = 3
      this.onerror && this.onerror(error)
    }
  }
  
  // 绑定全局事件
  window.WebSocket.prototype._bindGlobalEvents = function() {
    let isOpened = false
    let isClosed = false
    
    // 打开事件
    uni.onSocketOpen(() => {
      if (!isOpened && !isClosed) {
        isOpened = true
        this.readyState = 1 // OPEN
        this.onopen && this.onopen()
      }
    })
    
    // 消息事件
    uni.onSocketMessage((res) => {
      if (this.readyState === 1) {
        this.onmessage && this.onmessage({ data: res.data })
      }
    })
    
    // 关闭事件
    uni.onSocketClose(() => {
      if (!isClosed) {
        isClosed = true
        this.readyState = 3 // CLOSED
        this.onclose && this.onclose()
        this._cleanupEvents()
      }
    })
    
    // 错误事件
    uni.onSocketError((err) => {
      if (!isClosed) {
        isClosed = true
        this.readyState = 3
        console.error('❌ WebSocket 错误:', err)
        this.onerror && this.onerror(err)
        this._cleanupEvents()
      }
    })
    
    // 设置连接超时
    this._timeoutId = setTimeout(() => {
      if (!isOpened && !isClosed) {
        isClosed = true
        this.readyState = 3
        const error = new Error('WebSocket connection timeout')
        console.error('❌ WebSocket 连接超时')
        this.onerror && this.onerror(error)
        this._cleanupEvents()
        
        // 尝试关闭连接
        try {
          uni.closeSocket()
        } catch (e) {
          // 忽略关闭错误
        }
      }
    }, 15000) // 15秒超时
  }
  
  // 清理事件
  window.WebSocket.prototype._cleanupEvents = function() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId)
      this._timeoutId = null
    }
  }
  
  // send 方法
  window.WebSocket.prototype.send = function(data) {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not connected')
    }
    
    return new Promise((resolve, reject) => {
      uni.sendSocketMessage({
        data: data,
        success: () => resolve(),
        fail: (err) => reject(err)
      })
    })
  }
  
  // close 方法
  window.WebSocket.prototype.close = function(code = 1000, reason = '') {
    if (this.readyState === 2 || this.readyState === 3) return
    
    this.readyState = 2 // CLOSING
    uni.closeSocket({
      code: code,
      reason: reason,
      success: () => {
        this.readyState = 3
        this._cleanupEvents()
      },
      fail: (err) => {
        console.error('关闭 WebSocket 失败:', err)
        this.readyState = 3
        this._cleanupEvents()
      }
    })
  }
  
  // 静态常量
  window.WebSocket.CONNECTING = 0
  window.WebSocket.OPEN = 1
  window.WebSocket.CLOSING = 2
  window.WebSocket.CLOSED = 3
  
  // #endif
}

/**
 * 平台特定的 WebSocket 设置
 */
function setupPlatformWebSocket() {
  // #ifdef H5
  // H5 环境不需要特殊处理
  // #endif
  
  // #ifdef APP-PLUS
  overrideWebSocketGlobally()
  // #endif
}

/**
 * 自动重连机制
 */
async function autoReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  
  reconnectTimer = setTimeout(async () => {
    try {
      await connectSignalR()
    } catch (error) {
      console.error('❌ 自动重连失败，继续尝试...', error)
      // 继续重连
      autoReconnect()
    }
  }, 5000)
}

/**
 * 主连接函数 - 保持长连接
 */
export const connectSignalR = async () => {
  // 如果已经有连接，直接返回
  if (globalConnection && globalConnection.state === 'Connected') {
    return globalConnection
  }
  
  // 如果正在连接中，等待
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return connectSignalR()
  }
  
  isConnecting = true
  
  try {
    // 先设置 WebSocket Polyfill
    setupPlatformWebSocket()

    const signalRstore = useSignalRstore()
    const messageStore = useMessageStore()

    const ptid = uni.getStorageSync('ptid') || ''
    const sub = uni.getStorageSync('userId') || ''

    if (!sub) {
      throw new Error('❌ 缺少用户ID，无法建立 SignalR 连接')
    }

    // 创建连接
    const connection = new HubConnectionBuilder()
      .withUrl('http://172.16.134.9:6015/api/chat', {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delay = Math.min(retryContext.previousRetryCount * 2000, 10000)
          return delay
        }
      })
      .build()

    // 设置连接关闭时的处理
    connection.onclose((error) => {
      globalConnection = null
      // 自动重连
      autoReconnect()
    })

    connection.onreconnecting((error) => {
    })

    connection.onreconnected((connectionId) => {
    })

    // 设置连接超时
    const connectWithTimeout = Promise.race([
      connection.start(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15s')), 15000)
      )
    ])

    await connectWithTimeout

    // 登录到 SignalR
    await connection.invoke('Login', sub)

    // 存储全局连接实例
    globalConnection = connection

    // 存储连接信息
    signalRstore.setConnection(connection)
    signalRstore.setIdsUserId(sub)
    signalRstore.setPtUserId(ptid)

    // 设置消息处理器
    connection.on('ReceiveMessage', (message) => {
      messageStore.addNewMessage(message)
    })

    connection.on('SystemNotice', (notice) => 
      messageStore.addNewMessage({
        msgRecordId: Date.now().toString(),
        title: '系统通知',
        content: notice,
        time: new Date().toISOString(),
        isRead: false
      })
    })

    // 异步获取历史消息（不阻塞连接）
    setTimeout(async () => {
      try {
        const [allRes, unreadRes] = await Promise.all([
          getAllMsgApi({ pageIndex: 1, pageSize: 50, receiveUser: ptid }),
          getNoReadMsgApi({ userId: sub })
        ])

        if (allRes?.code === 200) {
          messageStore.setAllMessages(allRes.data?.content || allRes.data || [])
        }

        if (unreadRes?.code === 200) {
          messageStore.setUnreadMessages(unreadRes.data || [])
          signalRstore.setMsgCount(unreadRes.total || 0)
        }
      } catch (apiError) {
        console.warn('⚠️ 获取历史消息失败:', apiError)
      }
    }, 1000)

    isConnecting = false
    return connection

  } catch (error) {
    isConnecting = false
    console.error('❌ SignalR 连接失败：', error)
    
    // 连接失败也自动重连
    autoReconnect()
    
    throw error
  }
}

/**
 * 获取当前连接状态
 */
export const getConnectionStatus = () => {
  if (!globalConnection) {
    return 'Disconnected'
  }
  return globalConnection.state
}

/**
 * 检查是否已连接
 */
export const isConnected = () => {
  return globalConnection && globalConnection.state === 'Connected'
}

/**
 * 手动重连（只有在需要强制重连时使用）
 */
export const reconnectSignalR = async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  globalConnection = null
  return await connectSignalR()
}

/**
 * 保持连接活跃（可选，用于长时间运行的应用）
 */
export const keepAlive = () => {
  // 每5分钟检查一次连接状态
  setInterval(() => {
    if (!isConnected()) {
      connectSignalR().catch(error => {
        console.error('保持连接活跃重连失败:', error)
      })
    }
  }, 5 * 60 * 1000) // 5分钟
}

// 应用启动时自动开始保持连接
setTimeout(() => {
  keepAlive()
}, 10000) // 10秒后开始