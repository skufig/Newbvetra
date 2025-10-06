'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Lang = 'ru' | 'en'

interface ThemeLangContextType {
  theme: Theme
  lang: Lang
  toggleTheme: () => void
  switchLang: (l: Lang) => void
}

const ThemeLangContext = createContext<ThemeLangContextType>({
  theme: 'dark',
  lang: 'ru',
  toggleTheme: () => {},
  switchLang: () => {},
})

export function ThemeLangProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<Lang>('ru')

  // 🌓 Определяем системную тему и язык при загрузке
  useEffect(() => {
    const userLang = navigator.language.startsWith('en') ? 'en' : 'ru'
    const savedLang = (localStorage.getItem('lang') as Lang) || userLang
    setLang(savedLang)

    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = (localStorage.getItem('theme') as Theme) || (prefersDark ? 'dark' : 'light')
    setTheme(savedTheme)

    // Применяем тему к HTML
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  // 🌗 Переключение темы
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // 🌍 Смена языка
  const switchLang = (newLang: Lang) => {
    setLang(newLang)
    localStorage.setItem('lang', newLang)
    // Здесь можно редиректить на нужную локаль:
    if (newLang === 'en') {
      window.location.href = '/en'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <ThemeLangContext.Provider value={{ theme, lang, toggleTheme, switchLang }}>
      {children}
    </ThemeLangContext.Provider>
  )
}

export const useThemeLang = () => useContext(ThemeLangContext)
