// store/modules/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    const userid = ref('')
    const userloginlogid = ref('')
    const loginname = ref('')
    const access_token = ref('')
    const refresh_token = ref('')
    const expires_in = ref('')
    const expiration_timestamp = ref(0)
    const userRoles = ref(['0'])
    const isLoading = ref(false)
    const allSysCodeUrl = ref<string[]>([])
    const allSysCode = ref<string[]>([])
    const searchKey = ref<string[]>([])

    const setUserMessage = (
      userId: string,
      loginName: string,
      accessToken: string,
      refreshToken: string,
      expiresIn: string,
      timestamp: number,
      userRole: string[]
    ) => {
      userid.value = userId
      loginname.value = loginName
      access_token.value = accessToken
      expires_in.value = expiresIn
      refresh_token.value = refreshToken
      expiration_timestamp.value = timestamp
      userRoles.value = userRole
    }

    const setlogid = (userLoginLogId: string) => {
      userloginlogid.value = userLoginLogId
    }

    const removeUserMessage = () => {
      userid.value = ''
      userloginlogid.value = ''
      loginname.value = ''
      access_token.value = ''
      expires_in.value = ''
      refresh_token.value = ''
      expiration_timestamp.value = 0
      userRoles.value = ['0']
      allSysCodeUrl.value = []
      allSysCode.value = []
      searchKey.value = []
    }

    const setSysCodeUrlItem = (sysCodeUrl: string) => {
      allSysCodeUrl.value.push(sysCodeUrl)
    }

    const setSysCodeItem = (sysCode: string) => {
      allSysCode.value.push(sysCode)
    }

    const addSearchKey = (key: string) => {
      if (!searchKey.value.includes(key)) {
        if (searchKey.value.length >= 10) {
          searchKey.value.shift()
        }
        searchKey.value.push(key)
      }
    }

    return {
      userid,
      userloginlogid,
      loginname,
      access_token,
      expires_in,
      refresh_token,
      expiration_timestamp,
      userRoles,
      isLoading,
      allSysCodeUrl,
      allSysCode,
      searchKey,
      setUserMessage,
      setlogid,
      removeUserMessage,
      setSysCodeUrlItem,
      setSysCodeItem,
      addSearchKey
    }
  },
  {
    persist: true
  }
)
