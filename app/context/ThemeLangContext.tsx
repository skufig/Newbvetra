'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Lang = 'ru' | 'en'

interface ThemeLangContextType {
  theme: Theme
  lang: Lang
  toggleTheme: () => void
  switchLang: (lang: Lang) => void
}

const ThemeLangContext = createContext<ThemeLangContextType | undefined>(undefined)

export const ThemeLangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<Lang>('ru')

  // Автоопределение при загрузке
  useEffect(() => {
    // Тема: system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const currentTheme = storedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')

    // Язык: system lang
    const browserLang = navigator.language.startsWith('en') ? 'en' : 'ru'
    const storedLang = localStorage.getItem('lang') as Lang | null
    setLang(storedLang || browserLang)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const switchLang = (newLang: Lang) => {
    setLang(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <ThemeLangContext.Provider value={{ theme, lang, toggleTheme, switchLang }}>
      {children}
    </ThemeLangContext.Provider>
  )
}

export const useThemeLang = () => {
  const ctx = useContext(ThemeLangContext)
  if (!ctx) throw new Error('useThemeLang must be used within ThemeLangProvider')
  return ctx
}
