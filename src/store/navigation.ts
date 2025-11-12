import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavigationStore = defineStore(
  'navigation',
  () => {
    const language = ref('zh')
    const setLanguage = (newLanguage: any) => {
      language.value = newLanguage
    }

    return {
      language,
      setLanguage,
    }
  },
  {
    persist: true,
  }
)
