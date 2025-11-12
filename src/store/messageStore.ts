import { defineStore } from 'pinia'

export const useMessageStore = defineStore('messageStore', {
  state: () => ({
    allMessages: [],         // 全部消息
    allUnreadMessages: [],   // 未读消息
    lastUpdateTime: null,    // 最后更新时间，用于消息去重
    isConnected: false       // 连接状态
  }),

  getters: {
    unreadCount: (state) => state.allUnreadMessages.length,
    
    latestUnreadMessages: (state) =>
      [...state.allUnreadMessages]
        .sort((a, b) => new Date(b.sendTime || b.time) - new Date(a.sendTime || a.time))
        .slice(0, 3)
        .map(msg => msg.content || msg.title || '新消息'),

    // 按时间排序的全部消息（最新的在前）
    sortedAllMessages: (state) =>
      [...state.allMessages].sort((a, b) => 
        new Date(b.sendTime || b.time) - new Date(a.sendTime || a.time)
      ),

    // 按时间排序的未读消息（最新的在前）
    sortedUnreadMessages: (state) =>
      [...state.allUnreadMessages].sort((a, b) => 
        new Date(b.sendTime || b.time) - new Date(a.sendTime || a.time)
      )
  },

  actions: {
    // 设置连接状态
    setConnectionStatus(connected) {
      this.isConnected = connected
    },

    // 设置全部消息（初始化时使用）
    setAllMessages(messages) {
      if (!messages || !Array.isArray(messages)) {
        this.allMessages = []
        return
      }
      
      // 去重处理
      const uniqueMessages = this.removeDuplicateMessages(messages)
      this.allMessages = uniqueMessages
      this.updateUnreadMessagesFromAll()
      this.lastUpdateTime = Date.now()
    },

    // 设置未读消息
    setUnreadMessages(messages) {
      if (!messages || !Array.isArray(messages)) {
        this.allUnreadMessages = []
        return
      }
      
      this.allUnreadMessages = this.removeDuplicateMessages(messages)
    },

    // 添加新消息（实时推送时使用）
    // 在 messageStore.ts 的 actions 中添加
    addNewMessage(newMessage) {
      if (!newMessage) return
      
      const message = this.normalizeMessage(newMessage)
      
      // 检查是否已存在
      const isDuplicate = this.isMessageDuplicate(message)
      if (isDuplicate) {
        console.log('🔄 消息已存在，跳过添加:', message.msgRecordId)
        return
      }
    
      // 添加到全部消息列表
      this.allMessages.unshift(message)
      
      // 如果是未读消息，也添加到未读列表
      if (!message.isRead) {
        this.allUnreadMessages.unshift(message)
        console.log('📨 新消息已添加到未读列表:', message.content)
        
        // 显示通知
        uni.showToast({
          title: `新消息: ${message.content.substring(0, 20)}...`,
          icon: 'none',
          duration: 3000
        })
      }
    
      this.lastUpdateTime = Date.now()
    },

    // 添加未读消息（兼容旧接口）
    addUnreadMessage(msg) {
      this.addNewMessage({
        ...msg,
        isRead: false
      })
    },

    // 标记单条消息为已读
    markAsRead(msgId) {
      console.log('📝 标记消息为已读:', msgId)
      
      // 更新全部消息列表中的状态
      this.allMessages = this.allMessages.map(msg => 
        msg.msgRecordId === msgId || msg.msgId === msgId 
          ? { ...msg, isRead: true }
          : msg
      )
      
      // 从未读列表中移除
      this.allUnreadMessages = this.allUnreadMessages.filter(msg => 
        !(msg.msgRecordId === msgId || msg.msgId === msgId)
      )
      
      console.log('✅ 消息已读状态更新完成，剩余未读:', this.allUnreadMessages.length)
    },

    // 批量标记为已读
    markMultipleAsRead(msgIds) {
      msgIds.forEach(msgId => this.markAsRead(msgId))
    },

    // 标记所有消息为已读
    markAllAsRead() {
      console.log('📝 标记所有消息为已读')
      
      this.allMessages = this.allMessages.map(msg => ({
        ...msg,
        isRead: true
      }))
      
      this.allUnreadMessages = []
      console.log('✅ 所有消息已标记为已读')
    },

    // 删除单条消息
    deleteMessage(msgId) {
      this.allMessages = this.allMessages.filter(msg => 
        !(msg.msgRecordId === msgId || msg.msgId === msgId)
      )
      this.allUnreadMessages = this.allUnreadMessages.filter(msg => 
        !(msg.msgRecordId === msgId || msg.msgId === msgId)
      )
    },

    // 清空所有消息
    clearAllMessages() {
      this.allMessages = []
      this.allUnreadMessages = []
      this.lastUpdateTime = null
    },

    // 根据全部消息更新未读消息列表
    updateUnreadMessagesFromAll() {
      this.allUnreadMessages = this.allMessages.filter(msg => !msg.isRead)
    },

    // 消息去重逻辑
    removeDuplicateMessages(messages) {
      const seen = new Set()
      return messages.filter(msg => {
        const identifier = msg.msgRecordId || 
                          `${msg.content}_${msg.sendTime || msg.time}`
        if (seen.has(identifier)) {
          return false
        }
        seen.add(identifier)
        return true
      })
    },

    // 检查消息是否重复
    isMessageDuplicate(message) {
      const identifier = message.msgRecordId || 
                        `${message.content}_${message.sendTime || message.time}`
      
      return this.allMessages.some(msg => {
        const existingIdentifier = msg.msgRecordId || 
                                 `${msg.content}_${msg.sendTime || msg.time}`
        return existingIdentifier === identifier
      })
    },

    // 消息数据标准化
    normalizeMessage(msg) {
      return {
        msgRecordId: msg.msgRecordId || msg.msgId || `temp_${Date.now()}_${Math.random()}`,
        msgId: msg.msgId || msg.msgRecordId,
        title: msg.title || '新消息',
        content: msg.content || msg.message || msg.title || '无内容',
        sendTime: msg.sendTime || msg.time || new Date().toISOString(),
        time: msg.time || msg.sendTime || new Date().toISOString(),
        isRead: msg.isRead !== undefined ? msg.isRead : false,
        messageType: msg.messageType || 'normal',
        ...msg
      }
    },

    // 触发新消息通知（可选）
    triggerNewMessageNotification(message) {
      // 只有在应用处于前台时才显示通知
      if (typeof uni !== 'undefined' && uni.showToast) {
        setTimeout(() => {
          uni.showToast({
            title: `新消息: ${message.content.substring(0, 20)}${message.content.length > 20 ? '...' : ''}`,
            icon: 'none',
            duration: 3000
          })
        }, 100)
      }
    },

    // 查找消息
    findMessage(msgId) {
      return this.allMessages.find(msg => 
        msg.msgRecordId === msgId || msg.msgId === msgId
      )
    },

    // 获取指定数量的最新消息
    getLatestMessages(count = 10) {
      return this.sortedAllMessages.slice(0, count)
    }
  },

  persist: {
    key: 'message-store',
    paths: ['allMessages', 'allUnreadMessages', 'lastUpdateTime']
  }
})