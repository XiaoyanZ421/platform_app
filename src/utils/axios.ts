type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestConfig {
  url: string
  method?: HttpMethod
  data?: any
  headers?: Record<string, string>
  params?: any
}

// 标准API响应结构（根据实际后端调整）

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// ==================== 请求实例 ====================
export const createUniRequest = (baseURL: string) => {
  // 错误处理函数
  const handleUnauthorized = () => {
    uni.removeStorageSync('access_token')
    uni.removeStorageSync('refresh_token')
	uni.removeStorageSync('ptid')
	uni.removeStorageSync('userId')
    uni.navigateTo({ url: '/pages/login' })
  }

  const showError = (msg: string) => {
    uni.showToast({ title: msg, icon: 'none', duration: 2000 })
  }

  // 类型守卫：检查是否为标准API响应
  const isApiResponse = (data: any): data is ApiResponse => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      'message' in data
    )
  }

  // 核心请求方法
  const request = <T>(
    method: HttpMethod,
    url: string,
    data?: any,
    config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
  ): Promise<T> => {
    const isFullUrl = url.startsWith('http')

    const token = uni.getStorageSync('access_token')
    const ptid = uni.getStorageSync('ptid')
	const userId = uni.getStorageSync('userId')

    const headers = {
      'source-client': 'miniapp',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...config?.headers
    }
	let requestUrl = isFullUrl ? url : `${baseURL}${url}`
	  if (method === 'GET' && config?.params) {
	    const query = Object.entries(config.params)
	      .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
	      .join('&')
	    requestUrl += (requestUrl.includes('?') ? '&' : '?') + query
	  }
    return new Promise((resolve, reject) => {
        uni.request({
          url: requestUrl,
          method: method as any,
          data: method !== 'GET' ? data : undefined,
          header: headers,
          success: (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              showError(`请求失败，状态码：${res.statusCode}`)
              if (res.statusCode === 401) handleUnauthorized()
              reject(res)
            } else {
              resolve(res.data as T)
            }
          },
          fail: (err) => {
            showError('网络错误，请检查连接')
            reject(err)
          }
        })
      })
    }

  return {
    request,
    get: <T>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) =>
      request<T>('GET', url, undefined, config),
    post: <T>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) =>
      request<T>('POST', url, data, config),
    put: <T>(url: string, data?: any, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) =>
      request<T>('PUT', url, data, config),
    delete: <T>(url: string, config?: Omit<RequestConfig, 'url' | 'method' | 'data'>) =>
      request<T>('DELETE', url, undefined, config)
  }
}
