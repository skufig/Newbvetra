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

  useEffect(() => {
    const raw = localStorage.getItem('bvetra_chat_history')
    if (raw) setMessages(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

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

  const startListening = () => {
    if (!recognitionRef.current)
      return alert('Голосовой ввод не поддерживается')
    recognitionRef.current.start()
    setListening(true)
  }
  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const append = (m: Msg) => setMessages((s) => [...s, m])

  const sendMessage = async () => {
    if (!input.trim()) return
    append({ role: 'user', content: input })
    const msg = input
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      })
      const data = await res.json()
      append({
        role: 'assistant',
        content: data.reply || 'Нет ответа от AI',
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

  const submitOrder = async () => {
    if (!order.name || !order.phone)
      return setOrderResult('Укажите имя и телефон')
    setOrderSending(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, chatHistory: messages }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrderResult('Заказ успешно отправлен!')
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

  return (
    <>
      {open ? (
        <div className="fixed bottom-5 right-5 w-96 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-xl z-50">
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
            className="h-64 overflow-y-auto space-y-2 mb-2 text-sm"
          >
            {messages.length === 0 && (
              <div className="text-neutral-400">
                Задайте вопрос, например: «Как заказать трансфер на завтра?»
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-xl ${
                  m.role === 'user'
                    ? 'bg-gold text-black ml-auto max-w-[80%]'
                    : m.role === 'order'
                    ? 'bg-white/5 text-white'
                    : 'bg-neutral-800 text-white max-w-[85%]'
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
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
              className="flex-1 bg-neutral-800 px-3 py-2 rounded-lg text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-gold text-black px-3 py-2 rounded-lg"
            >
              <Send size={16} />
            </button>
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
                onChange={(e) =>
                  setOrder({ ...order, phone: e.target.value })
                }
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
