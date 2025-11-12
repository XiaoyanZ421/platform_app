import { idsInstance, businessInstance } from '@/utils/httpClient'

export const getRoles = (rolename?: string) => {
  return idsInstance.get<{
    id: string
    name: string
    description?: string
  }[]>('/api/Role/GetRolesAsync', { params: { rolename } })
}

export const getPermissions = (params: {
  roleId?: string
  systemId?: string
}) => {
  return businessInstance.post<{
    menus: PermissionMenu[]
    buttons: string[]
  }>('/api/SysInfo/GetPermissionAsync', params)
}

export const getSysIdsByRoleId = (roleId: string) => {
  return businessInstance.get<string[]>(
    '/api/RolePermission/GetSysInfoIdByRoleIdAsync',
    { params: { roleId } }
  )
}

export const updateRolePermissions = (data: {
  roleId: string
  permissionIds: string[]
}) => {
  return businessInstance.post<{
    success: boolean
    message?: string
  }>('/api/RolePermission/EditRolePermissionAsync', data)
}

// 类型定义（根据实际接口调整）
interface PermissionMenu {
  id: string
  name: string
  children?: PermissionMenu[]
}