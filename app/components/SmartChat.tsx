'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, X, Trash, Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'classnames'

type Msg = { role: 'user' | 'assistant' | 'system' | 'order'; content: string }

const QUICK = [
  'Как заказать трансфер?',
  'Сколько стоит поездка в аэропорт?',
  'Можно ли заказать на завтра?',
  'Какие автомобили доступны?',
]

const CAR_CLASSES = [
  { id: 'standard', label: 'Стандарт' },
  { id: 'comfort', label: 'Комфорт' },
  { id: 'business', label: 'Бизнес' },
  { id: 'minivan', label: 'Минивэн' },
]

export default function SmartChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // order state (if user triggers "Заказ" flow)
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderSending, setOrderSending] = useState(false)
  const [orderResult, setOrderResult] = useState<string | null>(null)
  const [order, setOrder] = useState({
    name: '',
    phone: '',
    pickup: '',
    dropoff: '',
    datetime: '',
    notes: '',
    carClass: '',
  })

  // keyboard offset for mobile
  const [isFocused, setIsFocused] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // load history
  useEffect(() => {
    const raw = localStorage.getItem('bvetra_chat_history')
    if (raw) setMessages(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  // speech recognition (optional)
  useEffect(() => {
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput((p) => (p ? p + ' ' + text : text))
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
  }, [])

  // visualViewport keyboard offset (mobile)
  useEffect(() => {
    const handleViewport = () => {
      const vv = (window as any).visualViewport
      if (vv && isFocused) {
        const kb = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
        setKeyboardOffset(kb)
      } else {
        setKeyboardOffset(0)
      }
    }
    const vv = (window as any).visualViewport
    if (vv) {
      vv.addEventListener('resize', handleViewport)
      vv.addEventListener('scroll', handleViewport)
    }
    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleViewport)
        vv.removeEventListener('scroll', handleViewport)
      }
    }
  }, [isFocused])

  const openChat = () => setOpen(true)
  const closeChat = () => setOpen(false)

  const append = (m: Msg) => setMessages((s) => [...s, m])

  // send a message to /api/chat
  const sendMessage = async (msgText?: string) => {
    const message = msgText ?? input
    if (!message.trim()) return
    append({ role: 'user', content: message })
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      })
      const data = await res.json()
      const reply = data.reply || data.message || 'Извините, нет ответа'
      append({ role: 'assistant', content: reply })
      // if assistant suggests opening order modal via text pattern, we can auto-open:
      if (/подтвердить заказ|оформить заказ|оформление заказа/i.test(reply)) {
        setOrderOpen(true)
      }
    } catch (e) {
      append({ role: 'assistant', content: 'Ошибка при обращении к серверу' })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('bvetra_chat_history')
  }

  const startListening = () => {
    if (!recognitionRef.current) return alert('Голосовой ввод не поддерживается')
    recognitionRef.current.start()
    setListening(true)
  }
  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  // Phone input simple mask (accept any international)
  const handlePhoneChange = (val: string) => {
    // allow digits, +, spaces, parentheses, dashes
    const cleaned = val.replace(/[^\d+\- ()]/g, '')
    setOrder({ ...order, phone: cleaned })
  }

  // submit order to /api/order (sends chatHistory too)
  const submitOrder = async () => {
    if (!order.name || !order.phone) {
      setOrderResult('Укажите имя и телефон')
      return
    }
    setOrderSending(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, chatHistory: messages }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrderResult('Заказ отправлен. Спасибо!')
        append({
          role: 'order',
          content: `Заказ: ${order.name} ${order.phone} — ${order.pickup} → ${order.dropoff} ${order.datetime} (${order.carClass})`,
        })
        setOrderOpen(false)
      } else {
        setOrderResult(data.message || 'Ошибка при отправке')
      }
    } catch (e) {
      setOrderResult('Ошибка соединения')
    } finally {
      setOrderSending(false)
    }
  }

  // helper: choose car class from chat buttons
  const chooseCarClass = (cls: string) => {
    setOrder((o) => ({ ...o, carClass: cls }))
    append({ role: 'user', content: `Выбрал класс: ${cls}` })
  }

  const bottomStyle = 18 + (keyboardOffset > 0 ? keyboardOffset : 0)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ bottom: bottomStyle }}
            className="fixed right-5 z-50 w-[min(420px,92vw)]"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle />
                  <span className="text-sm font-semibold">AI ассистент</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOrderOpen(true)}
                    className="bg-gold text-black text-sm px-2 py-1 rounded"
                  >
                    Оформить заказ
                  </button>
                  <button onClick={clearChat} title="Очистить" className="p-1 rounded hover:bg-white/5">
                    <Trash size={16} />
                  </button>
                  <button onClick={closeChat} title="Закрыть" className="p-1 rounded hover:bg-white/5">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="h-[55vh] max-h-[60vh] overflow-y-auto space-y-2 mb-2 px-1 text-sm">
                {messages.length === 0 && (
                  <div className="text-neutral-400 px-2">Здравствуйте! Задайте вопрос или оформите заказ.</div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={clsx('p-2 rounded-xl mx-2', {
                      'bg-gold text-black ml-auto max-w-[80%]': m.role === 'user',
                      'bg-neutral-800 text-white max-w-[85%]': m.role === 'assistant',
                      'bg-white/5 text-white max-w-[85%]': m.role === 'order',
                    })}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              {/* quick replies */}
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* car class quick buttons */}
              <div className="flex gap-2 items-center mb-2 px-1">
                {CAR_CLASSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      chooseCarClass(c.label)
                      // assist the assistant by sending a message too
                      sendMessage(`Выбираю класс: ${c.label}`)
                    }}
                    className="text-sm px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-1">
                <button onClick={() => (listening ? stopListening() : startListening())} className="p-2 rounded hover:bg-white/5">
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Введите сообщение..."
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 120)}
                  className="flex-1 bg-neutral-800 px-3 py-2 rounded-lg text-sm outline-none"
                />

                <button onClick={() => sendMessage()} disabled={loading} className="bg-gold text-black px-3 py-2 rounded-lg">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* floating open button */}
      {!open && (
        <button
          onClick={openChat}
          className="fixed bottom-5 right-5 bg-gold text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
          title="Открыть чат"
        >
          <MessageCircle />
        </button>
      )}

      {/* ORDER modal */}
      <AnimatePresence>
        {orderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOrderOpen(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-neutral-900 border border-white/10 rounded-2xl p-6 w-[min(640px,96vw)] z-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Оформление заказа</h3>
                <button onClick={() => setOrderOpen(false)} className="p-1 rounded hover:bg-white/5">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} placeholder="Имя" className="p-2 bg-neutral-800 rounded" />
                <input value={order.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="Телефон (+...)" className="p-2 bg-neutral-800 rounded" />
                <input value={order.pickup} onChange={(e) => setOrder({ ...order, pickup: e.target.value })} placeholder="Адрес подачи" className="p-2 bg-neutral-800 rounded md:col-span-2" />
                <input value={order.dropoff} onChange={(e) => setOrder({ ...order, dropoff: e.target.value })} placeholder="Адрес назначения" className="p-2 bg-neutral-800 rounded md:col-span-2" />
                <input value={order.datetime} onChange={(e) => setOrder({ ...order, datetime: e.target.value })} placeholder="Дата и время" className="p-2 bg-neutral-800 rounded" />
                <select value={order.carClass} onChange={(e) => setOrder({ ...order, carClass: e.target.value })} className="p-2 bg-neutral-800 rounded">
                  <option value="">Выберите класс авто</option>
                  {CAR_CLASSES.map((c) => (
                    <option key={c.id} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <textarea value={order.notes} onChange={(e) => setOrder({ ...order, notes: e.target.value })} placeholder="Примечание" className="p-2 bg-neutral-800 rounded md:col-span-2" />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button onClick={submitOrder} disabled={orderSending} className="bg-gold text-black px-4 py-2 rounded">
                  {orderSending ? 'Отправка...' : 'Отправить заказ'}
                </button>
                <button onClick={() => setOrderOpen(false)} className="px-4 py-2 border border-white/20 rounded">
                  Отмена
                </button>
                <div className="ml-auto text-sm text-white/80">{orderResult}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
              }
