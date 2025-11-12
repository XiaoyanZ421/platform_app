import { createI18n } from 'vue-i18n'

// 导入语言包
import zh from '@/i18n/langs/zh.ts'
import en from '@/i18n/langs/en.ts'

const getLocale = () => {
  return uni.getStorageSync('preferredLanguage') || 'zh'
}

const i18n = createI18n({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'zh',
  globalInjection: true,
  messages: {
    zh,
    en
  }
})

export default i18n
