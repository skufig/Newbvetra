'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Sun, Moon, Globe } from 'lucide-react'

export default function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const userLang = navigator.language.startsWith('ru') ? 'ru' : 'en'
    setLang(userLang)
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light'
    if (storedTheme) setTheme(storedTheme)
    document.documentElement.classList.toggle('dark', storedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const switchLang = (newLang: 'ru' | 'en') => {
    setLang(newLang)
    window.location.href = newLang === 'ru' ? '/' : '/en'
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md">
      <Link href="/" className="text-xl font-bold text-gold">Bvetra</Link>

      <nav className="hidden md:flex gap-6 text-sm text-gray-300">
        <Link href="/">Главная</Link>
        <Link href="/about">О компании</Link>
        <Link href="/services">Услуги</Link>
        <Link href="/contact">Контакты</Link>
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 bg-neutral-800 px-3 py-1.5 rounded-xl text-sm"
          >
            <Globe size={16} /> {lang.toUpperCase()}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-24 bg-neutral-900 border border-neutral-700 rounded-xl text-sm shadow-lg">
              <button onClick={() => switchLang('ru')} className="block w-full text-left px-3 py-2 hover:bg-neutral-800">RU</button>
              <button onClick={() => switchLang('en')} className="block w-full text-left px-3 py-2 hover:bg-neutral-800">EN</button>
            </div>
          )}
        </div>

        <button onClick={toggleTheme} className="bg-neutral-800 p-2 rounded-xl">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
