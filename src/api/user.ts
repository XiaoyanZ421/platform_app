import { businessInstance, idsInstance } from '@/utils/httpClient'
// 登录
export const usePassWordLogin = (data: any) => {
  return idsInstance.post('/api/Token/PassWordLogin', data)
}

// 添加用户
export const useAddUserAsync = (data: any) => {
  return businessInstance.post('/api/User/AddUserAsync', data)
}

// 通过用户 ID 获取用户
export const useGetUsersByIdAsync = (userid: any) => {
  return businessInstance.get('/api/User/GetUsersByIdAsync', {
    params: { userid }
  })
}

// 通过工号查询用户信息
export const useGetUserByCodeAsync = (code: any) => {
  return businessInstance.get('/api/User/GetUserByCodeAsync', {
    params: code
  })
}

// 更新用户信息
export const useUpdateUserAsync = (data: any) => {
  return businessInstance.post('/api/User/UpdateUserAsync', data)
}

// 更新用户密码
export const useUpdatePassword = (data: any) => {
  return businessInstance.post('/api/User/UpdatePassword', data)
}

// 上传文件
export const useUpload = (data: any) => {
  return businessInstance.post('/api/User/Upload', data)
}

// 初始化密码
export const useInitializePassword = (idsUserId: any) => {
  return businessInstance.get('/api/User/InitializePassword', { params: idsUserId})
}

// 软删除用户
export const useSoftDeletionUserAsync = (userId: any) => {
  return businessInstance.get('/api/User/SoftDeletionUserAsync', {
    params: { userId }
  })
}

export const GetUserByJobsAsync = (data: any) => {
  return businessInstance.post('/api/User/GetUserByJobsAsync', data)
}

// 获取全部消息
export const getAllMsgApi = (params: any) => {
  return businessInstance.get('/api/Msg/GetAll', { params })
}
// 获取未读消息
export const getNoReadMsgApi = (userId: any) => {
  return businessInstance.get('/api/Msg/GetNoReadMsg', { params: userId })
}

// 阅读消息
export const ReaMsgdpi = (msgId: any) => {
  return businessInstance.get('/api/Msg/ReadMsg', { params: msgId })
}

// 获取消息详情
export const GetMsgDetail = (msgId: any) => {
  return businessInstance.get('/api/Msg/GetMsgDetail', { params: msgId })
}
