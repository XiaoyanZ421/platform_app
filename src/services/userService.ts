// 基础请求配置
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
}

// 响应结构
export interface Response<T = any> {
  code: number
  data: T
  message?: string
}

// 平台适配器接口
export interface PlatformAdapter {
  request: <T>(config: RequestConfig) => Promise<Response<T>>
  upload?: (config: {
    url: string
    filePath: string
    name: string
    formData?: Record<string, any>
  }) => Promise<Response>
}