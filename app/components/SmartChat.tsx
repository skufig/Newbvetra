'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, X, Trash, Mic, MicOff } from 'lucide-react'

type Msg = { role: 'user' | 'assistant' | 'system' | 'order'; content: string }

const quickReplies = [
  'Как заказать трансфер?',
  'Сколько стоит поездка в аэропорт?',
  'Можно ли заказать на завтра?',
  'Какие автомобили доступны?',
]

export default function SmartChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

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
  })

  const [isFocused, setIsFocused] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // --- Глобальное открытие чата ---
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('openSmartChat', handler as EventListener)
    return () => window.removeEventListener('openSmartChat', handler as EventListener)
  }, [])

  // --- История ---
  useEffect(() => {
    const raw = localStorage.getItem('bvetra_chat_history')
    if (raw) setMessages(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  // --- Speech Recognition ---
  useEffect(() => {
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setInput((prev) => (prev ? prev + ' ' + text : text))
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
  }, [])

  // --- Keyboard offset ---
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

  const startListening = () => {
    if (!recognitionRef.current) return alert('Голосовой ввод не поддерживается')
    recognitionRef.current.start()
    setListening(true)
  }
  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const append = (m: Msg) => setMessages((s) => [...s, m])

  const sendMessage = async (msgText?: string) => {
    const message = msgText || input
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
      append({
        role: 'assistant',
        content: data.reply || data.message || 'Нет ответа от AI',
      })
    } catch {
      append({ role: 'assistant', content: 'Ошибка при обращении к серверу' })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('bvetra_chat_history')
  }

  // --- Маска телефона ---
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    let formatted = '+7 '
    if (value.length > 1)
      formatted += `(${value.slice(1, 4)}${value.length >= 4 ? ') ' : ''}`
    if (value.length >= 5) formatted += value.slice(4, 7)
    if (value.length >= 8) formatted += '-' + value.slice(7, 9)
    if (value.length >= 10) formatted += '-' + value.slice(9, 11)
    setOrder({ ...order, phone: formatted })
  }

  const submitOrder = async () => {
    if (!order.name || !order.phone) return setOrderResult('Укажите имя и телефон')
    setOrderSending(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, chatHistory: messages }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrderResult('✅ Заказ успешно отправлен!')
        append({
          role: 'order',
          content: `Заказ от ${order.name} (${order.phone}): ${order.pickup} → ${order.dropoff} (${order.datetime})`,
        })
        setOrderOpen(false)
      } else setOrderResult(data.message || 'Ошибка при отправке')
    } catch {
      setOrderResult('Ошибка соединения')
    } finally {
      setOrderSending(false)
    }
  }

  const bottomStyle = 20 + (keyboardOffset > 0 ? keyboardOffset : 0)

  return (
    <>
      {open ? (
        <div
          className="fixed z-50 right-5 transition-all duration-200"
          style={{ bottom: bottomStyle, width: 'min(420px, 92vw)' }}
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
                  Заказ
                </button>
                <button
                  onClick={clearChat}
                  title="Очистить"
                  className="p-1 rounded hover:bg-white/5"
                >
                  <Trash size={16} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Закрыть"
                  className="p-1 rounded hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="h-[55vh] max-h-[60vh] overflow-y-auto space-y-2 mb-2 text-sm px-1"
            >
              {messages.length === 0 ? (
                <div className="text-neutral-400 px-2">
                  Задайте вопрос, например: «Как заказать трансфер на завтра?»
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl mx-2 ${
                      m.role === 'user'
                        ? 'bg-gold text-black ml-auto max-w-[80%]'
                        : m.role === 'order'
                        ? 'bg-white/5 text-white'
                        : 'bg-neutral-800 text-white max-w-[85%]'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>

            {/* Быстрые ответы */}
            <div className="flex flex-wrap gap-1 mb-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Поле ввода */}
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => (listening ? stopListening() : startListening())}
                className="p-2 rounded hover:bg-white/5"
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                className="flex-1 bg-neutral-800 px-3 py-2 rounded-lg text-sm outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="bg-gold text-black px-3 py-2 rounded-lg"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 bg-gold text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
        >
          <MessageCircle />
        </button>
      )}

      {/* Модалка заказа */}
      {orderOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-[90%] max-w-md">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-semibold">Оформление заказа</h3>
              <button onClick={() => setOrderOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={order.name}
                onChange={(e) =>
                  setOrder({ ...order, name: e.target.value })
                }
                placeholder="Имя"
                className="w-full p-2 bg-neutral-800 rounded"
              />
              <input
                value={order.phone}
                onChange={handlePhoneInput}
                placeholder="Телефон"
                className="w-full p-2 bg-neutral-800 rounded"
              />
              <input
                value={order.pickup}
                onChange={(e) =>
                  setOrder({ ...order, pickup: e.target.value })
                }
                placeholder="Адрес подачи"
                className="w-full p-2 bg-neutral-800 rounded"
              />
              <input
                value={order.dropoff}
                onChange={(e) =>
                  setOrder({ ...order, dropoff: e.target.value })
                }
                placeholder="Адрес назначения"
                className="w-full p-2 bg-neutral-800 rounded"
              />
              <input
                value={order.datetime}
                onChange={(e) =>
                  setOrder({ ...order, datetime: e.target.value })
                }
                placeholder="Дата и время"
                className="w-full p-2 bg-neutral-800 rounded"
              />
              <textarea
                value={order.notes}
                onChange={(e) =>
                  setOrder({ ...order, notes: e.target.value })
                }
                placeholder="Примечание"
                className="w-full p-2 bg-neutral-800 rounded"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={submitOrder}
                disabled={orderSending}
                className="bg-gold text-black px-4 py-2 rounded"
              >
                {orderSending ? 'Отправка...' : 'Отправить'}
              </button>
              <button
                onClick={() => setOrderOpen(false)}
                className="px-4 py-2 border border-white/20 rounded"
              >
                Отмена
              </button>
            </div>

            {orderResult && (
              <div className="mt-3 text-sm text-white/80">{orderResult}</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
