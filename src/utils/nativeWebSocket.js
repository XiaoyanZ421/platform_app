// utils/nativeWebSocket.js
import { getNoReadMsgApi, getAllMsgApi } from '@/api/user.ts'
import { useSignalRstore } from '@/store/signalRstore.js'
import { useMessageStore } from '@/store/messageStore.ts'

class NativeWebSocketClient {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.messageHandlers = new Map()
    this._isConnecting = false
    this._reconnectAttempts = 0
    this._reconnectDelay = 1000
    this._maxReconnectDelay = 30000
    this._handledError = false
    this._eventHandlers = null
    this._shouldReconnect = true
    this._isActive = true
  }

  // 设置页面活跃状态
  setActive(active) {
    this._isActive = active
    console.log(`📱 WebSocket 页面状态: ${active ? '活跃' : '后台'}`)
    
    if (active && !this.isConnected && !this._isConnecting) {
      // 如果页面变为活跃且未连接，立即尝试连接
      console.log('🔄 页面回到前台，尝试连接')
      this._silentReconnect()
    } else if (!active) {
      // 页面进入后台，可以适当降低重连频率或保持现状
      console.log('⏸️ 页面进入后台，保持当前连接状态')
    }
  }

  // 连接到 WebSocket 服务器
  async connect() {
    // 检查页面是否活跃
    if (!this._isActive) {
      console.log('⏸️ 页面不在活跃状态，暂停连接尝试')
      throw new Error('页面不在活跃状态')
    }

    // 如果正在连接中，等待
    if (this._isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return this.connect()
    }

    // 如果已经连接，直接返回
    if (this.isConnected && this.ws) {
      return this
    }

    this._isConnecting = true

    const ptid = uni.getStorageSync('ptid') || ''
    const sub = uni.getStorageSync('userId') || ''

    if (!sub) {
      this._isConnecting = false
      throw new Error('缺少用户ID')
    }

    this.ptid = ptid
    this.sub = sub

    return new Promise((resolve, reject) => {
      try {
        // WebSocket URL
        const wsUrl = 'ws://172.16.134.9:6015/api/chat'

        this.ws = uni.connectSocket({
          url: wsUrl,
          header: {
            'content-type': 'application/json'
          },
          success: () => {
            console.log('🚀 WebSocket 开始连接...')
          },
          fail: (err) => {
            this._isConnecting = false
            this._handleConnectionError(err, reject)
          }
        })

        // 监听事件
        this._setupEventListeners(resolve, reject)

        // 设置连接超时
        this._connectionTimeout = setTimeout(() => {
          if (!this.isConnected && this._isConnecting) {
            this._isConnecting = false
            console.error('❌ 连接超时')
            reject(new Error('连接超时'))
          }
        }, 10000)

      } catch (error) {
        this._isConnecting = false
        reject(error)
      }
    })
  }

  // 设置事件监听器
  _setupEventListeners(resolve, reject) {
    // 连接打开
    const openHandler = (res) => {
      console.log('✅ WebSocket 连接成功')
      if (this._connectionTimeout) {
        clearTimeout(this._connectionTimeout)
        this._connectionTimeout = null
      }
      
      this.isConnected = true
      this._isConnecting = false
      this._reconnectAttempts = 0 // 重置重连计数
      this._reconnectDelay = 1000 // 重置重连延迟
      
      // 发送登录消息
      this.login().then(() => {
        console.log('✅ 登录消息发送成功')
        resolve(this)
      }).catch(error => {
        console.error('❌ 登录失败:', error)
        reject(error)
      })
    }

    // 收到消息
    const messageHandler = (res) => {
      try {
        // 过滤掉非JSON数据（如握手取消消息）
        if (typeof res.data === 'string') {
          // 检查是否包含握手取消的错误信息
          if (res.data.includes('Handshake was canceled') || 
              res.data.includes('Unrecognized token')) {
            console.warn('⚠️ 收到握手取消消息，尝试重新连接')
            this._handleHandshakeCanceled()
            return
          }
          
          // 检查是否是空消息或无效消息
          if (res.data.trim() === '' || res.data === '') {
            console.warn('⚠️ 收到空消息或无效消息')
            return
          }
          
          // 尝试解析JSON
          const message = JSON.parse(res.data)
          this._handleMessage(message)
        } else {
          console.warn('⚠️ 收到非字符串消息:', res.data)
        }
      } catch (error) {
        console.error('❌ 消息解析错误:', error, '原始数据:', res.data)
        
        // 如果是JSON解析错误，尝试清理数据
        if (error instanceof SyntaxError) {
          this._handleMalformedMessage(res.data)
        }
      }
    }

    // 连接关闭
    const closeHandler = (res) => {
      console.log('🔌 WebSocket 连接关闭, 状态码:', res.code, '原因:', res.reason)
      this.isConnected = false
      this._isConnecting = false
      
      // 无论什么原因关闭，只要页面活跃就重连
      if (this._isActive) {
        console.log('🔌 连接关闭，准备重连...')
        this._silentReconnect()
      } else {
        console.log('⏸️ 页面不在活跃状态，暂停重连')
      }
    }

    // 连接错误
    const errorHandler = (err) => {
      console.error('❌ WebSocket 连接错误:', err)
      this.isConnected = false
      this._isConnecting = false
      
      if (!this._handledError) {
        this._handledError = true
        reject(err)
      }
      
      if (this._isActive) {
        this._silentReconnect()
      }
    }

    // 绑定事件监听器
    uni.onSocketOpen(openHandler)
    uni.onSocketMessage(messageHandler)
    uni.onSocketClose(closeHandler)
    uni.onSocketError(errorHandler)

    // 保存处理器引用
    this._eventHandlers = {
      open: openHandler,
      message: messageHandler,
      close: closeHandler,
      error: errorHandler
    }
  }

  // 处理握手取消
  _handleHandshakeCanceled() {
    console.log('🤝 握手被取消，关闭当前连接并重新连接')
    // 先关闭当前连接
    if (this.ws) {
      uni.closeSocket()
      this.ws = null
    }
    this.isConnected = false
    this._isConnecting = false
    
    // 延迟重新连接
    setTimeout(() => {
      if (this._isActive) {
        this._silentReconnect()
      }
    }, 1000)
  }

  // 处理格式错误的消息
  _handleMalformedMessage(data) {
    try {
      // 尝试清理特殊字符
      const cleanedData = data.toString()
        .replace(/[^\x20-\x7E\r\n]/g, '')
        .trim()
      
      if (cleanedData && cleanedData !== '{}' && cleanedData !== '') {
        if (cleanedData.startsWith('{') && cleanedData.endsWith('}')) {
          const message = JSON.parse(cleanedData)
          this._handleMessage(message)
        }
      }
    } catch (e) {
      console.warn('⚠️ 无法修复的消息格式:', data)
    }
  }

  // 处理连接错误
  _handleConnectionError(err, reject) {
    console.error('❌ WebSocket 连接失败:', err)
    
    if (this._isActive) {
      this._silentReconnect()
    }
    reject(err)
  }

  // 静默重连（永久重连）
  async _silentReconnect() {
    // 检查页面是否活跃
    if (!this._isActive) {
      console.log('⏸️ 页面不在活跃状态，暂停重连')
      return
    }

    // 防止重复重连
    if (this._isConnecting || this.isConnected) {
      return
    }

    this._reconnectAttempts++
    
    // 指数退避算法，但设置最大延迟
    const delay = Math.min(this._reconnectDelay * Math.pow(1.5, this._reconnectAttempts - 1), this._maxReconnectDelay)
    
    console.log(`🔧 第${this._reconnectAttempts}次重连，${delay}ms后尝试...`)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await this.connect()
      console.log('✅ 重连成功')
    } catch (error) {
      console.error(`❌ 第${this._reconnectAttempts}次重连失败:`, error.message)
      // 失败后继续重连
      this._silentReconnect()
    }
  }

  // 处理收到的消息
  _handleMessage(message) {
    const messageStore = useMessageStore()
    
    switch (message.type) {
      case 'ReceiveMessage':
        messageStore.addNewMessage(message.data)
        break
        
      case 'SystemNotice':
        messageStore.addNewMessage({
          msgRecordId: Date.now().toString(),
          title: '系统通知',
          content: message.data,
          time: new Date().toISOString(),
          isRead: false
        })
        break
        
      default:
        console.log('📨 未知消息类型:', message.type, message.data)
    }
  }

  // 登录到服务器
  async login() {
    const loginMessage = {
      type: 'Login',
      data: this.sub,
      timestamp: Date.now()
    }
    
    return this.send(loginMessage)
  }

  // 发送消息
  send(message) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket 未连接')
    }

    return new Promise((resolve, reject) => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      
      uni.sendSocketMessage({
        data: messageStr,
        success: () => {
          resolve()
        },
        fail: (err) => {
          console.error('❌ 消息发送失败:', err)
          this.isConnected = false
          reject(new Error(`发送失败: ${err.errMsg || err}`))
        }
      })
    })
  }

  // 关闭连接（手动停止）
  close() {
    console.log('🛑 手动关闭WebSocket连接')
    this._isActive = false // 停止重连
    this._shouldReconnect = false
    
    if (this._connectionTimeout) {
      clearTimeout(this._connectionTimeout)
      this._connectionTimeout = null
    }
    
    if (this.ws) {
      uni.closeSocket()
      this.ws = null
    }
    
    this.isConnected = false
    this._isConnecting = false
  }

  // 重新启动连接
  restart() {
    console.log('🔄 重新启动WebSocket连接')
    this._isActive = true
    this._shouldReconnect = true
    this._silentReconnect()
  }

  // 添加消息处理器
  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler)
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this._isConnecting,
      reconnectAttempts: this._reconnectAttempts,
      isActive: this._isActive
    }
  }
}

// 创建全局实例
let webSocketClient = null

export const connectSignalR = async () => {
  if (!webSocketClient) {
    webSocketClient = new NativeWebSocketClient()
    // 默认设置为活跃状态
    webSocketClient.setActive(true)
  }

  const signalRstore = useSignalRstore()
  const messageStore = useMessageStore()

  const ptid = uni.getStorageSync('ptid') || ''
  const sub = uni.getStorageSync('userId') || ''

  try {
    const client = await webSocketClient.connect()
    
    // 存储连接信息
    signalRstore.setConnection(client)
    signalRstore.setIdsUserId(sub)
    signalRstore.setPtUserId(ptid)

    // 异步获取历史消息
    setTimeout(async () => {
      try {
        await fetchHistoricalMessages(ptid, sub, messageStore, signalRstore)
      } catch (error) {
        console.log('⚠️ 获取历史消息失败:', error)
      }
    }, 1000)

    return client

  } catch (error) {
    console.error('❌ WebSocket 连接失败:', error)
    throw error
  }
}

// 获取历史消息
async function fetchHistoricalMessages(ptid, sub, messageStore, signalRstore) {
  try {
    const [allRes, unreadRes] = await Promise.all([
      getAllMsgApi({ pageIndex: 1, pageSize: 50, receiveUser: ptid }),
      getNoReadMsgApi({ userId: sub })
    ])

    if (allRes?.code === 200 && allRes.success) {
      const messages = allRes.data?.content || allRes.data || []
      messageStore.setAllMessages(messages)
    }

    if (unreadRes?.code === 200 && unreadRes.success) {
      const unreadMessages = unreadRes.data || []
      messageStore.setUnreadMessages(unreadMessages)
      signalRstore.setMsgCount(unreadRes.total || 0)
    }
  } catch (error) {
    console.log('⚠️ 获取历史消息失败:', error)
  }
}

// 页面生命周期管理
export const setWebSocketActive = (active) => {
  if (webSocketClient) {
    webSocketClient.setActive(active)
  }
}

// 检查连接状态
export const checkConnectionStatus = () => {
  return webSocketClient ? webSocketClient.getStatus() : { 
    isConnected: false, 
    isConnecting: false,
    reconnectAttempts: 0,
    isActive: false
  }
}

// 检查是否已连接
export const isConnected = () => {
  return webSocketClient ? webSocketClient.isConnected : false
}

// 获取连接实例
export const getWebSocketClient = () => {
  return webSocketClient
}

// 发送消息
export const sendMessage = (message) => {
  if (webSocketClient && webSocketClient.isConnected) {
    return webSocketClient.send(message)
  } else {
    throw new Error('WebSocket 未连接')
  }
}

// 关闭连接
export const closeConnection = () => {
  if (webSocketClient) {
    webSocketClient.close()
  }
}

// 重启连接
export const restartConnection = () => {
  if (webSocketClient) {
    webSocketClient.restart()
  } else {
    connectSignalR().catch(console.error)
  }
}

// 启动自动连接服务
let autoConnectStarted = false

export const startAutoConnect = () => {
  if (autoConnectStarted) return
  
  autoConnectStarted = true
  
  // 应用启动时立即连接
  setTimeout(() => {
    connectSignalR().catch(error => {
      console.log('🔧 首次连接失败，自动重连机制会继续工作')
    })
  }, 2000)
}

// 立即启动自动连接
startAutoConnect()