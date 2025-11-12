import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSignalRstore = defineStore('signalr', () => {
  const connection = ref(null)
  const msgCount = ref(0)
  const idsUserId = ref(null)
  const ptUserId = ref(null)
  const durationTime = ref(null)
  const isShow = ref(false)
  const msgId = ref(null)
  const currentNotification = ref(null)

  const setConnection = (conn) => {
    connection.value = conn
  }
  const setMsgCount = (count) => {
    msgCount.value = count
  }
  const setIdsUserId = (id) => {
    idsUserId.value = id
  }
  const setPtUserId = (id) => {
    ptUserId.value = id
  }
  const setDurationTime = (val) => {
    durationTime.value = val
  }
  const setIsShow = (val) => {
    isShow.value = val
  }
  const setMsgId = (val) => {
    msgId.value = val
  }
  const setCurrentNotification = (val) => {
    currentNotification.value = val
  }

  return {
    connection,
    msgCount,
    idsUserId,
    ptUserId,
    durationTime,
    isShow,
    msgId,
    currentNotification,
    setConnection,
    setMsgCount,
    setIdsUserId,
    setPtUserId,
    setDurationTime,
    setIsShow,
    setMsgId,
    setCurrentNotification
  }
})
