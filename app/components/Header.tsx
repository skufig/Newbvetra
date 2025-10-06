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
  MessageSquare
} from 'lucide-react'
import clsx from 'classnames'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const userLang =
      (localStorage.getItem('lang') as 'ru' | 'en') ||
      (navigator.language.startsWith('en') ? 'en' : 'ru')
    setLang(userLang)

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const currentTheme = savedTheme || 'dark'
    setTheme(currentTheme)
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')

    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const switchLang = (newLang: 'ru' | 'en') => {
    setLang(newLang)
    localStorage.setItem('lang', newLang)
    setLangMenuOpen(false)
  }

  const NavLinks = () => (
    <>
      <Link href="/" className="hover:text-gold transition">Главная</Link>
      <Link href="/services" className="hover:text-gold transition">Услуги</Link>
      <Link href="/about" className="hover:text-gold transition">О нас</Link>
      <Link href="/contacts" className="hover:text-gold transition">Контакты</Link>
    </>
  )

  // AI чат (API-заглушка)
  const handleChat = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      setResponse(data.message || 'Нет ответа')
    } catch {
      setResponse('Ошибка при подключении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* HEADER */}
      <header
        className={clsx(
          'fixed top-0 z-50 w-full transition-all duration-500 backdrop-blur-lg border-b border-white/10',
          scrolled ? 'bg-black/60 dark:bg-zinc-900/70 shadow-md' : 'bg-transparent'
        )}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          {/* ЛОГО */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-gold hover:text-white transition-transform hover:scale-105"
          >
            <Car size={26} className="text-gold" />
            <span>Bvetra<span className="text-white/70">Pro</span></span>
          </Link>

          {/* ДЕСКТОП */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />

            {/* THEME */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* LANGUAGE */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition"
              >
                <Languages size={18} />
                <span className="uppercase font-medium">{lang}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-zinc-900/95 border border-white/10 shadow-xl backdrop-blur-xl animate-fade-in">
                  <button
                    onClick={() => switchLang('ru')}
                    className={`flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 rounded-lg transition ${
                      lang === 'ru' ? 'text-gold' : ''
                    }`}
                  >
                    <Globe size={16} />
                    <span>Русский</span>
                  </button>
                  <button
                    onClick={() => switchLang('en')}
                    className={`flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 rounded-lg transition ${
                      lang === 'en' ? 'text-gold' : ''
                    }`}
                  >
                    <Globe size={16} />
                    <span>English</span>
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

          {/* МОБИЛЬНЫЙ БУРГЕР */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* МОБИЛЬНОЕ МЕНЮ */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/90 dark:bg-zinc-900/90 backdrop-blur-xl animate-fade-in">
            <div className="flex flex-col items-center gap-4 py-5">
              <NavLinks />

              <div className="flex gap-4">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {theme === 'dark' ? 'Светлая' : 'Тёмная'}
                </button>

                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  <Languages size={18} />
                  {lang.toUpperCase()}
                </button>
              </div>

              {langMenuOpen && (
                <div className="flex flex-col gap-2 mt-2">
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
              )}

              <Link
                href="/order"
                className="bg-gold text-black font-semibold px-5 py-2 rounded-xl hover:bg-white hover:text-black transition mt-3"
              >
                Заказать
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* КНОПКА AI-ЧАТА */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 bg-gold text-black p-4 rounded-full shadow-lg hover:bg-white transition"
        title="AI-чат"
      >
        <MessageSquare size={22} />
      </button>

      {/* МОДАЛЬНОЕ ОКНО AI-ЧАТ */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-zinc-900 text-white p-6 rounded-2xl max-w-md w-full relative border border-white/10">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-gold"
            >
              <X size={22} />
            </button>
            <h2 className="text-lg font-semibold mb-3">AI-чат Bvetra</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Введите вопрос..."
              className="w-full p-3 rounded-lg bg-zinc-800 border border-white/10 text-white resize-none h-28"
            />
            <button
              onClick={handleChat}
              disabled={loading}
              className="mt-3 w-full bg-gold text-black font-semibold px-4 py-2 rounded-lg hover:bg-white transition"
            >
              {loading ? 'Обработка...' : 'Отправить'}
            </button>
            {response && (
              <div className="mt-4 bg-zinc-800/70 p-3 rounded-lg text-sm text-white/80 max-h-48 overflow-y-auto whitespace-pre-line">
                {response}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
