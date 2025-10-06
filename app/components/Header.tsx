'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Sun,
  Globe,
  Languages,
  Menu,
  X,
  Car,
  MessageSquare,
  Send,
} from 'lucide-react'
import clsx from 'classnames'
import { useThemeLang } from '../context/ThemeLangContext'

/**
 * Header with:
 * - theme/lang from context
 * - animated mobile menu (slide from right + backdrop dim)
 * - AI chat modal (can open Order modal)
 * - Order modal that posts to /api/order and shows results
 *
 * Note:
 * - No secrets here. /api/order should handle sending to Telegram/Bitrix.
 * - Add framer-motion dependency: npm i framer-motion
 */

export default function Header() {
  const { theme, lang, toggleTheme, switchLang } = useThemeLang()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)

  // chat state
  const [prompt, setPrompt] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatResponse, setChatResponse] = useState<string | null>(null)

  // order form
  const [order, setOrder] = useState({
    name: '',
    phone: '',
    pickup: '',
    dropoff: '',
    datetime: '',
    notes: '',
  })
  const [orderSending, setOrderSending] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  const [scrolled, setScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on outside click (when open)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!mobileMenuRef.current) return
      if (mobileOpen && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [mobileOpen])

  const NavLinks = () => (
    <>
      <Link href="/" className="hover:text-gold transition">
        {lang === 'ru' ? 'Главная' : 'Home'}
      </Link>
      <Link href="/services" className="hover:text-gold transition">
        {lang === 'ru' ? 'Услуги' : 'Services'}
      </Link>
      <Link href="/about" className="hover:text-gold transition">
        {lang === 'ru' ? 'О нас' : 'About'}
      </Link>
      <Link href="/contacts" className="hover:text-gold transition">
        {lang === 'ru' ? 'Контакты' : 'Contacts'}
      </Link>
    </>
  )

  // -------------------
  // Chat: call /api/chat (server-side should call OpenAI)
  // -------------------
  const sendChat = async () => {
    if (!prompt.trim()) return
    setChatLoading(true)
    setChatResponse(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, lang }),
      })
      const data = await res.json()
      setChatResponse(data.message || (lang === 'ru' ? 'Нет ответа' : 'No reply'))
    } catch (e) {
      setChatResponse(lang === 'ru' ? 'Ошибка подключения' : 'Connection error')
    } finally {
      setChatLoading(false)
    }
  }

  // -------------------
  // Order: send to /api/order
  // -------------------
  const submitOrder = async () => {
    if (!order.name || !order.phone) {
      setOrderResult({ ok: false, message: lang === 'ru' ? 'Укажите имя и телефон' : 'Provide name and phone' })
      return
    }
    setOrderSending(true)
    setOrderResult(null)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, chatHistory: [] }),
      })
      const data = await res.json()
      setOrderResult(data)
      if (data?.ok) {
        // reset form on success
        setOrder({ name: '', phone: '', pickup: '', dropoff: '', datetime: '', notes: '' })
        setOrderOpen(false)
      }
    } catch (e) {
      setOrderResult({ ok: false, message: String(e) })
    } finally {
      setOrderSending(false)
    }
  }

  // small helpers for animation
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }
  const slideRight = { hidden: { x: '100%' }, visible: { x: 0 }, exit: { x: '100%' } }

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 z-50 w-full transition-all duration-500 backdrop-blur-lg border-b border-white/10',
          scrolled ? 'bg-black/70 dark:bg-zinc-900/70 shadow-md' : 'bg-transparent'
        )}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          {/* logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-gold hover:text-white transition-transform hover:scale-105"
            aria-label="BvetraPro"
          >
            <Car size={26} className="text-gold" />
            <span>Bvetra<span className="text-white/70">Pro</span></span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks />

            {/* theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Сменить на светлую тему' : 'Switch to dark theme'}
              title={theme === 'dark' ? (lang === 'ru' ? 'Светлая тема' : 'Light') : (lang === 'ru' ? 'Тёмная тема' : 'Dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition"
                aria-expanded={langOpen}
                title={lang === 'ru' ? 'Язык' : 'Language'}
              >
                <Languages size={18} />
                <span className="uppercase font-medium">{lang}</span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-44 rounded-2xl bg-zinc-900/95 border border-white/10 shadow-xl backdrop-blur-xl overflow-hidden"
                  >
                    <button
                      onClick={() => { switchLang('ru'); setLangOpen(false) }}
                      className={clsx('flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 transition', lang === 'ru' ? 'text-gold' : '')}
                    >
                      <Globe size={16} />
                      <span>Русский</span>
                    </button>
                    <button
                      onClick={() => { switchLang('en'); setLangOpen(false) }}
                      className={clsx('flex items-center gap-3 px-4 py-2 w-full hover:bg-white/10 transition', lang === 'en' ? 'text-gold' : '')}
                    >
                      <Globe size={16} />
                      <span>English</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <Link
              href="/order"
              className="bg-gold text-black font-semibold px-5 py-2 rounded-xl hover:bg-white hover:text-black transition"
            >
              {lang === 'ru' ? 'Заказать' : 'Order'}
            </Link>
          </nav>

          {/* mobile burger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen(true)}
              className="hidden md:inline-flex items-center justify-center bg-gold text-black p-2 rounded-lg hover:scale-[1.03] transition"
              title={lang === 'ru' ? 'AI-чат' : 'AI chat'}
            >
              <MessageSquare size={18} />
            </button>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="Меню"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU (sliding panel + dim backdrop) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={backdropVariants}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[80] bg-black/60"
            />

            {/* sliding panel */}
            <motion.aside
              key="panel"
              ref={mobileMenuRef}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideRight}
              transition={{ type: 'tween', duration: 0.32 }}
              className="fixed right-0 top-0 z-[90] h-full w-[78%] max-w-xs bg-zinc-900/95 border-l border-white/10 p-6 backdrop-blur-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Car size={22} className="text-gold" />
                  <div className="font-semibold text-lg">BvetraPro</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-4">
                <NavLinks />
              </nav>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span className="text-sm">{theme === 'dark' ? (lang === 'ru' ? 'Светлая' : 'Light') : (lang === 'ru' ? 'Тёмная' : 'Dark')}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setLangOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  >
                    <Languages size={16} />
                    <span className="uppercase text-sm">{lang}</span>
                  </button>

                  <AnimatePresence>
                    {langOpen && (
                      <motion.div className="absolute left-0 mt-2 w-40 rounded-lg bg-zinc-800 border border-white/10 p-2" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                        <button onClick={() => { switchLang('ru'); setLangOpen(false) }} className={clsx('block w-full text-left px-3 py-2 rounded hover:bg-white/10', lang === 'ru' ? 'text-gold' : '')}>
                          Русский
                        </button>
                        <button onClick={() => { switchLang('en'); setLangOpen(false) }} className={clsx('block w-full text-left px-3 py-2 rounded hover:bg-white/10', lang === 'en' ? 'text-gold' : '')}>
                          English
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/order" className="block text-center bg-gold text-black py-2 rounded-xl font-semibold hover:bg-white hover:text-black transition">
                  {lang === 'ru' ? 'Заказать' : 'Order'}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => setChatOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 max-w-lg w-[94%] bg-zinc-900/95 border border-white/10 rounded-2xl p-5 backdrop-blur-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare />
                  <div className="font-semibold">{lang === 'ru' ? 'AI-чат' : 'AI Chat'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOrderOpen(true)} className="px-3 py-1 rounded bg-gold text-black text-sm font-medium hover:scale-[1.02] transition">
                    {lang === 'ru' ? 'Заказ' : 'Order'}
                  </button>
                  <button onClick={() => setChatOpen(false)} className="p-2 rounded hover:bg-white/5">
                    <X />
                  </button>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={lang === 'ru' ? 'Спросите ассистента, например: "Закажи трансфер на завтра"' : 'Ask something, e.g. "Book a transfer for tomorrow"'}
                className="w-full min-h-[120px] resize-none p-3 rounded-lg bg-zinc-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-gold transition"
              />

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={sendChat}
                  disabled={chatLoading}
                  className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-white transition"
                >
                  <Send size={16} />
                  {chatLoading ? (lang === 'ru' ? 'Обработка...' : 'Processing...') : (lang === 'ru' ? 'Отправить' : 'Send')}
                </button>

                <button onClick={() => { setPrompt(''); setChatResponse(null); }} className="px-3 py-2 rounded-lg border border-white/10">
                  {lang === 'ru' ? 'Очистить' : 'Clear'}
                </button>
              </div>

              {chatResponse && (
                <div className="mt-4 bg-zinc-800/70 p-3 rounded-lg text-sm text-white/80 whitespace-pre-line">
                  {chatResponse}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Modal (can be opened from chat or header) */}
      <AnimatePresence>
        {orderOpen && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center" initial="hidden" animate="visible" exit="hidden">
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setOrderOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="relative z-10 max-w-md w-[94%] bg-zinc-900/95 border border-white/10 rounded-2xl p-6 backdrop-blur-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{lang === 'ru' ? 'Оформление заказа' : 'Create order'}</h3>
                <button onClick={() => setOrderOpen(false)} className="p-2 rounded hover:bg-white/5"><X /></button>
              </div>

              <div className="space-y-3">
                <input value={order.name} onChange={(e) => setOrder(prev => ({ ...prev, name: e.target.value }))} placeholder={lang === 'ru' ? 'Имя' : 'Name'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
                <input value={order.phone} onChange={(e) => setOrder(prev => ({ ...prev, phone: e.target.value }))} placeholder={lang === 'ru' ? 'Телефон' : 'Phone'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
                <input value={order.pickup} onChange={(e) => setOrder(prev => ({ ...prev, pickup: e.target.value }))} placeholder={lang === 'ru' ? 'Адрес подачи' : 'Pickup address'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
                <input value={order.dropoff} onChange={(e) => setOrder(prev => ({ ...prev, dropoff: e.target.value }))} placeholder={lang === 'ru' ? 'Адрес назначения' : 'Dropoff address'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
                <input value={order.datetime} onChange={(e) => setOrder(prev => ({ ...prev, datetime: e.target.value }))} placeholder={lang === 'ru' ? 'Дата и время' : 'Date & time'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
                <textarea value={order.notes} onChange={(e) => setOrder(prev => ({ ...prev, notes: e.target.value }))} placeholder={lang === 'ru' ? 'Примечание (опционально)' : 'Notes (optional)'} className="w-full p-3 bg-zinc-800 rounded-lg border border-white/10" />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button onClick={submitOrder} disabled={orderSending} className="bg-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-white transition">
                  {orderSending ? (lang === 'ru' ? 'Отправка...' : 'Sending...') : (lang === 'ru' ? 'Отправить' : 'Send')}
                </button>
                <button onClick={() => setOrderOpen(false)} className="px-4 py-2 border border-white/10 rounded-lg">
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              </div>

              {orderResult && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm">
                  <pre className="whitespace-pre-wrap text-xs text-white/80">{JSON.stringify(orderResult, null, 2)}</pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
