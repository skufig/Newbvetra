'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, X, Trash, Mic, MicOff } from 'lucide-react'

type Msg = { role: 'user' | 'assistant' | 'system' | 'order'; content: string }

export default function SmartChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [orderMode, setOrderMode] = useState(false)
  const recognitionRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // load from localStorage
    try {
      const raw = localStorage.getItem('bvetra_chat_history')
      if (raw) setMessages(JSON.parse(raw))
    } catch (e) {
      console.warn('Cannot parse chat history', e)
    }
  }, [])

  useEffect(() => {
    // persist
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    // scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Voice (Web Speech API) — graceful fallback
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const r = new SpeechRecognition()
    r.lang = 'ru-RU'
    r.interimResults = false
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((res: any) => res[0].transcript).join('')
      setInput((v) => (v ? v + ' ' + text : text))
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    recognitionRef.current = r
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return alert('Голосовой ввод не поддерживается в этом браузере')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch (e) {
      console.error(e)
      setListening(false)
    }
  }
  const stopListening = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setListening(false)
  }

  const append = (m: Msg) => setMessages((s) => [...s, m])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    append({ role: 'user', content: text })
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      })
      const data = await res.json()
      const reply = data.reply ?? data.message ?? 'Ошибка: нет ответа'
      append({ role: 'assistant', content: reply })
    } catch (e) {
      append({ role: 'assistant', content: 'Ошибка сервера при обращении к AI' })
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem('bvetra_chat_history')
  }

  // ORDER modal state
  const [orderOpen, setOrderOpen] = useState(false)
  const [order, setOrder] = useState({
    name: '',
    phone: '',
    pickup: '',
    dropoff: '',
    datetime: '',
    notes: '',
  })
  const [orderSending, setOrderSending] = useState(false)
  const [orderResult, setOrderResult] = useState<string | null>(null)

  const submitOrder = async () => {
    // basic validation
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
        setOrderResult('Заказ успешно отправлен')
        append({ role: 'order', content: `Заказ: ${order.name}, ${order.phone}, ${order.pickup} → ${order.dropoff} @ ${order.datetime}` })
        setOrderOpen(false)
      } else {
        setOrderResult(data.message || 'Ошибка при отправке заказа')
      }
    } catch (e) {
      setOrderResult('Ошибка сети при отправке заказа')
    } finally {
      setOrderSending(false)
    }
  }

  return (
    <>
      {/* Floating trigger */}
      {open ? (
        <div className="fixed bottom-5 right-5 w-96 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-xl z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle />
              <div className="text-sm font-semibold">AI-ассистент</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setOrderOpen(true) }} className="text-sm px-3 py-1 rounded-lg bg-gold text-black">Оформить заказ</button>
              <button onClick={clearHistory} title="Очистить диалог" className="p-1 rounded hover:bg-white/5"><Trash size={16} /></button>
              <button onClick={() => setOpen(false)} title="Скрыть" className="p-1 rounded hover:bg-white/5"><X size={16} /></button>
            </div>
          </div>

          <div ref={scrollRef} className="h-64 overflow-y-auto space-y-2 mb-2 text-sm">
            {messages.length === 0 && <div className="text-neutral-400">Задайте вопрос — например: «Как оформить трансфер на 3 человек?»</div>}
            {messages.map((m, i) => (
              <div key={i} className={`p-2 rounded-xl ${m.role === 'user' ? 'bg-gold text-black ml-auto max-w-[80%]' : (m.role === 'order' ? 'bg-white/5 text-white' : 'bg-neutral-800 text-white max-w-[85%]')}`}>
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => (listening ? stopListening() : startListening())} title="Голосовой ввод" className="p-2 rounded-lg hover:bg-white/5">
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 bg-neutral-800 rounded-xl px-3 py-2 outline-none text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
            />
            <button onClick={sendMessage} disabled={loading} className="bg-gold text-black px-3 py-2 rounded-xl">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 bg-gold text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50"
          title="Открыть чат"
        >
          <MessageCircle />
        </button>
      )}

      {/* ORDER modal */}
      {orderOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60">
          <div className="bg-neutral-900 p-6 rounded-2xl w-[90%] max-w-lg border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Оформление заказа</h3>
              <button onClick={() => setOrderOpen(false)} className="p-1"><X size={18} /></button>
            </div>

            <div className="space-y-2">
              <input value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} placeholder="Имя" className="w-full p-2 rounded bg-neutral-800"/>
              <input value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} placeholder="Телефон" className="w-full p-2 rounded bg-neutral-800"/>
              <input value={order.pickup} onChange={(e) => setOrder({ ...order, pickup: e.target.value })} placeholder="Адрес подачи" className="w-full p-2 rounded bg-neutral-800"/>
              <input value={order.dropoff} onChange={(e) => setOrder({ ...order, dropoff: e.target.value })} placeholder="Адрес назначения" className="w-full p-2 rounded bg-neutral-800"/>
              <input value={order.datetime} onChange={(e) => setOrder({ ...order, datetime: e.target.value })} placeholder="Дата и время" className="w-full p-2 rounded bg-neutral-800"/>
              <textarea value={order.notes} onChange={(e) => setOrder({ ...order, notes: e.target.value })} placeholder="Дополнения" className="w-full p-2 rounded bg-neutral-800"/>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={submitOrder} className="bg-gold text-black px-4 py-2 rounded" disabled={orderSending}>
                {orderSending ? 'Отправка...' : 'Отправить заказ'}
              </button>
              <button onClick={() => setOrderOpen(false)} className="px-4 py-2 rounded border border-white/10">Отмена</button>
            </div>

            {orderResult && <div className="mt-3 text-sm text-white/80">{orderResult}</div>}
          </div>
        </div>
      )}
    </>
  )
}
