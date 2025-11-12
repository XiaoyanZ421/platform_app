import { createUniRequest } from './axios'

// 服务地址配置
const serviceUrls = {
  IdentityServer: 'http://172.16.134.9:6014',
  Business: 'http://172.16.134.9:6015',
  demoapi: 'http://172.16.134.9:6018',
  workFlow: 'http://172.16.134.9:6017',

  // IdentityServer: 'http://192.168.61.14:7006',
  // Business: 'http://192.168.61.14:5001',
  // demoapi: 'http://192.168.61.14:7168',
  // workFlow: 'http://192.168.61.14:8088',

}

// 导出基础URL
export const {
  IdentityServer: idsUrl,
  Business: busUrl,
  demoapi: demoUrl,
  workFlow: workFlowUrl
} = serviceUrls

// 创建服务实例
export const idsInstance = createUniRequest(idsUrl)
export const businessInstance = createUniRequest(busUrl)
export const demoInstance = createUniRequest(demoUrl)
export const workFlowInstance = createUniRequest(workFlowUrl)
