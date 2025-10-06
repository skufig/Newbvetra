'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun, Globe, Languages } from 'lucide-react'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [menuOpen, setMenuOpen] = useState(false)

  // Автоопределение языка и темы при первом рендере
  useEffect(() => {
    const userLang = navigator.language.startsWith('en') ? 'en' : 'ru'
    setLang(userLang)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const currentTheme = savedTheme || 'dark'
    setTheme(currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')
  }, [])

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  // Переключение языка
  const switchLang = (newLang: 'ru' | 'en') => {
    setLang(newLang)
    setMenuOpen(false)
    if (newLang === 'en') {
      window.location.href = '/en' // на будущее, когда появится версия на английском
    } else {
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 bg-black/50 dark:bg-zinc-900/40">
      <div className="container flex items-center justify-between py-4">
        {/* ЛОГОТИП */}
        <Link href="/" className="text-2xl font-bold text-gold hover:text-white transition">
          Bvetra<span className="text-white/70">Pro</span>
        </Link>

        {/* НАВИГАЦИЯ */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-gold transition">Главная</Link>
          <Link href="/services" className="hover:text-gold transition">Услуги</Link>
          <Link href="/about" className="hover:text-gold transition">О нас</Link>
          <Link href="/contacts" className="hover:text-gold transition">Контакты</Link>

          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* ЯЗЫКОВОЕ МЕНЮ */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
              title="Выбор языка"
            >
              <Languages size={18} />
              <span className="uppercase text-sm">{lang}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-28 rounded-lg bg-zinc-800 border border-white/10 shadow-lg">
                <button
                  onClick={() => switchLang('ru')}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-white/10 ${
                    lang === 'ru' ? 'text-gold' : ''
                  }`}
                >
                  <Globe size={16} /> <span>Русский</span>
                </button>
                <button
                  onClick={() => switchLang('en')}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-white/10 ${
                    lang === 'en' ? 'text-gold' : ''
                  }`}
                >
                  <Globe size={16} /> <span>English</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
