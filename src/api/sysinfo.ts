import { businessInstance } from '@/utils/httpClient'

// 获取所有系统信息
export const useGetAllSysInfo = (name: string) => {
  return businessInstance.get('/api/SysInfo/GetAllSysInfo', {
    params: { name }
  })
}

// 获取移动端系统信息
export const useGetAllMSys = () => {
  return businessInstance.get('/api/SysInfo/GetAllMSys')
}

// 获取平台信息配置详情
export const useGetPtInfoConfigDetail = (params: any) => {
  return businessInstance.get('/api/SysInfo/GetPtInfoConfigDetail', {
    params
  })
}

// 添加/修改平台信息配置
export const useSavePtInfoConfig = (data: any) => {
  return businessInstance.post('/api/SysInfo/AddOrUpdatePtInfoConfig', data)
}

// 新增系统信息
export const useAddSysInfo = (data: any) => {
  return businessInstance.post('/api/SysInfo/AddSysInfoAsync', data)
}

// 修改系统信息
export const useUpdateSysInfo = (data: any) => {
  return businessInstance.post('/api/SysInfo/UpdateSysInfoAsync', data)
}

// 删除系统信息
export const useDeleteSysInfo = (params: any) => {
  return businessInstance.get('/api/SysInfo/SoftDeletionSysInfoAsync', {
    params
  })
}

// 获取系统信息列表
export const useGetSysInfoList = (params: any) => {
  return businessInstance.get('/api/SysInfo/GetSysInfoAsync', {
    params
  })
}

// 根据ID获取系统信息详情
export const useGetSysInfoById = (params: any) => {
  return businessInstance.get('/api/SysInfo/GetSysInfoByIdAsync', {
    params
  })
}

// 上传图片
export const useUploadFile = (data: FormData) => {
  return businessInstance.post('/api/SysInfo/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取系统名称
export const useGetPtInfoName = () => {
  return businessInstance.get('/api/SysInfo/GetPtInfoName')
}

// 移动端 -- 通过SysCode获取权限
export const useGetPermissionBySysCode = (params: any) => {
  return businessInstance.get('/api/SysInfo/GetPermissionBySysCode', {
    params
  })
}