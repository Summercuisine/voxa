import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref(localStorage.getItem('locale') || 'zh-CN')

  function setLocale(newLocale: string) {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  return { locale, setLocale }
})
