'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Moon,
  Sun,
  Globe,
  Languages,
  Menu,
  X,
  Car,
  ChevronDown,
} from 'lucide-react'
import clsx from 'classnames'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Автоопределение языка и темы при загрузке
  useEffect(() => {
    const userLang = navigator.language.startsWith('en') ? 'en' : 'ru'
    setLang(userLang)

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const currentTheme = savedTheme || 'dark'
    setTheme(currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')

    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Переключатель темы
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  // Переключатель языка
  const switchLang = (newLang: 'ru' | 'en') => {
    setLang(newLang)
    setLangMenuOpen(false)
    if (newLang === 'en') window.location.href = '/en'
    else window.location.href = '/'
  }

  const NavLinks = () => (
    <>
      <Link href="/" className="hover:text-gold transition">Главная</Link>
      <Link href="/services" className="hover:text-gold transition">Услуги</Link>
      <Link href="/about" className="hover:text-gold transition">О нас</Link>
      <Link href="/contacts" className="hover:text-gold transition">Контакты</Link>
    </>
  )

  return (
    <header
      className={clsx(
        'fixed top-0 z-50 w-full transition-all duration-500 backdrop-blur-md border-b border-white/10',
        scrolled ? 'bg-black/70 dark:bg-zinc-900/70 shadow-md' : 'bg-transparent'
      )}
    >
      <div className="container flex items-center justify-between py-4">
        {/* ЛОГОТИП */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-gold hover:text-white transition-transform hover:scale-105"
        >
          <Car size={26} className="text-gold" />
          <span>
            Bvetra<span className="text-white/70">Pro</span>
          </span>
        </Link>

        {/* НАВИГАЦИЯ — ДЕСКТОП */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />

          {/* Тема */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Язык */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition"
            >
              <Languages size={18} />
              <span className="uppercase text-sm">{lang}</span>
              <ChevronDown size={14} className="opacity-70" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg bg-zinc-800 border border-white/10 shadow-lg overflow-hidden">
                <button
                  onClick={() => switchLang('ru')}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-white/10 ${
                    lang === 'ru' ? 'text-gold' : ''
                  }`}
                >
                  <Globe size={16} /> Русский
                </button>
                <button
                  onClick={() => switchLang('en')}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-white/10 ${
                    lang === 'en' ? 'text-gold' : ''
                  }`}
                >
                  <Globe size={16} /> English
                </button>
              </div>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/order"
            className="bg-gold text-black font-semibold px-5 py-2 rounded-xl hover:bg-white hover:text-black transition"
          >
            Заказать
          </Link>
        </nav>

        {/* БУРГЕР */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/90 dark:bg-zinc-900/90 backdrop-blur-lg animate-fade-in">
          <div className="flex flex-col items-center gap-4 py-5">
            <NavLinks />

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </button>

            <div className="flex flex-col gap-2 w-full px-4">
              <button
                onClick={() => switchLang('ru')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition ${
                  lang === 'ru' ? 'text-gold' : ''
                }`}
              >
                <Globe size={16} /> Русский
              </button>
              <button
                onClick={() => switchLang('en')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition ${
                  lang === 'en' ? 'text-gold' : ''
                }`}
              >
                <Globe size={16} /> English
              </button>
            </div>

            <Link
              href="/order"
              className="bg-gold text-black font-semibold px-5 py-2 rounded-xl hover:bg-white hover:text-black transition mt-2"
            >
              Заказать
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
