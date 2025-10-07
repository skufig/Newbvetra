'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Send,
  MessageCircle,
  X,
  Trash,
  Mic,
  MicOff,
  Check,
  Loader2,
} from 'lucide-react'
import clsx from 'classnames'
import { formatPhoneForDisplay, isValidPhone } from '../../lib/phone'

type Msg = {
  id: string
  role: 'user' | 'assistant' | 'system' | 'order'
  content: string
  meta?: any
}

const quickReplies = [
  'Как заказать трансфер?',
  'Сколько стоит поездка в аэропорт?',
  'Можно ли заказать на завтра?',
  'Какие автомобили доступны?',
]

const carClasses = ['Стандарт', 'Комфорт', 'Бизнес', 'Минивэн']

export default function SmartChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [orderDraft, setOrderDraft] = useState<any>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendingOrder, setSendingOrder] = useState(false)
  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('bvetra_chat_history')
    if (raw) setMessages(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200
    }
  }, [messages])

  useEffect(() => {
    // speech
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
      setInput((p) => (p ? p + ' ' + text : text))
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
  }, [])

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

  // streaming chat: POST -> /api/chat/stream => ReadableStream text chunks
  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText) return
    const userMsg: Msg = {
      id: 'u_' + Date.now(),
      role: 'user',
      content: messageText,
    }
    append(userMsg)
    setInput('')

    // create placeholder assistant message (will be filled progressively)
    const assistantId = 'a_' + Date.now()
    setLastAssistantId(assistantId)
    append({ id: assistantId, role: 'assistant', content: '' })

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: messages }),
      })
      if (!res.ok) {
        // update assistant with error
        setMessages((s) =>
          s.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Ошибка сервера при получении ответа' }
              : m
          )
        )
        return
      }

      // read stream
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      let full = ''

      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value)
          full += chunk
          // update assistant message progressively
          setMessages((s) =>
            s.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
          )
        }
      }

      // after complete, try to let assistant output contain actionable JSON commands (optional)
      // e.g. assistant may include a JSON block with "order": { ... } — we attempt to parse
      try {
        const maybeJson = /```json\n([\s\S]*?)\n```/.exec(full)
        const payloadStr = maybeJson ? maybeJson[1] : null
        if (payloadStr) {
          const parsed = JSON.parse(payloadStr)
          if (parsed?.order) {
            setOrderDraft((prev: any) => ({ ...prev, ...parsed.order }))
            // show confirm prompt
            setConfirmOpen(true)
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setMessages((s) =>
        s.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Ошибка при подключении к API' }
            : m
        )
      )
    } finally {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('bvetra_chat_history')
  }

  // Chat-driven "Собранный заказ" подтверждение и отправка
  const openConfirmForOrder = (order?: any) => {
    setOrderDraft((prev: any) => ({ ...prev, ...(order || {}) }))
    setConfirmOpen(true)
  }

  const submitOrder = async () => {
    // minimal validation (phone flexible)
    if (!orderDraft.name || !orderDraft.phone) {
      alert('Пожалуйста, укажите имя и телефон в форме подтверждения.')
      return
    }
    setSendingOrder(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderDraft, chatHistory: messages }),
      })
      const data = await res.json()
      if (res.ok) {
        // append order message in chat
        append({
          id: 'ord_' + Date.now(),
          role: 'order',
          content: `Заказ отправлен: ${orderDraft.name} ${orderDraft.phone} — ${orderDraft.pickup || '-'} → ${orderDraft.dropoff || '-'} (${orderDraft.datetime || '-'})`,
        })
        setConfirmOpen(false)
        setOrderDraft({})
        alert('Заказ отправлен — проверяйте Telegram/CRM.')
      } else {
        alert('Ошибка отправки: ' + (data.message || JSON.stringify(data)))
      }
    } catch (e) {
      alert('Ошибка сети при отправке заказа')
    } finally {
      setSendingOrder(false)
    }
  }

  // helper to add prefilled car class quick buttons
  const addCarClassHint = (cls: string) => {
    // put to order draft and send a message telling assistant
    setOrderDraft((p: any) => ({ ...p, carClass: cls }))
    sendMessage(`Класс автомобиля: ${cls}`)
  }

  // UI
  return (
    <>
      {open ? (
        <div
          className="fixed z-50 right-5 bottom-5 w-[min(420px,94vw)] max-h-[86vh] flex flex-col"
          role="dialog"
          aria-label="AI ассистент"
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-xl flex flex-col h-full">
            {/* header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle />
                <span className="text-sm font-semibold">AI ассистент</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openConfirmForOrder(orderDraft)}
                  className="bg-gold text-black px-3 py-1 rounded text-sm hover:opacity-95"
                >
                  Оформить заказ
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

            {/* messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 mb-2 px-1"
              style={{ scrollbarGutter: 'stable' }}
            >
              {messages.length === 0 && (
                <div className="text-neutral-400 px-2">
                  Задайте вопрос или нажмите быстрый ответ.
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'rounded-lg p-3 max-w-full break-words',
                    m.role === 'user'
                      ? 'bg-white text-black ml-auto max-w-[78%]'
                      : m.role === 'assistant'
                      ? 'bg-neutral-800 text-white max-w-[85%]'
                      : m.role === 'order'
                      ? 'bg-white/5 border border-white/8 text-white'
                      : 'bg-white/10'
                  )}
                >
                  {m.role === 'assistant' && m.content === '' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Печатает...
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  )}
                </div>
              ))}
            </div>

            {/* quick replies and car class */}
            <div className="mb-2 flex flex-wrap gap-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mb-2 flex items-center gap-2 overflow-x-auto">
              {carClasses.map((c) => (
                <button
                  key={c}
                  onClick={() => addCarClassHint(c)}
                  className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* input */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => (listening ? stopListening() : startListening())}
                className="p-2 rounded hover:bg-white/5"
                title="Голосом"
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Введите сообщение..."
                className="flex-1 bg-neutral-800 px-3 py-2 rounded-lg text-sm outline-none"
              />

              <button
                onClick={() => sendMessage()}
                className="bg-gold text-black px-3 py-2 rounded-lg"
                title="Отправить"
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
          aria-label="Открыть чат"
        >
          <MessageCircle />
        </button>
      )}

      {/* Order confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-neutral-900 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Подтвердите заказ</h3>
              <button onClick={() => setConfirmOpen(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <label className="block text-xs text-neutral-400">Имя</label>
              <input
                value={orderDraft.name || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, name: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
                placeholder="Имя"
              />

              <label className="block text-xs text-neutral-400 mt-2">Телефон</label>
              <input
                value={orderDraft.phone || ''}
                onChange={(e) =>
                  setOrderDraft({ ...orderDraft, phone: formatPhoneForDisplay(e.target.value) })
                }
                className="w-full p-2 bg-neutral-800 rounded"
                placeholder="+7 912 345-67-89"
              />

              <label className="block text-xs text-neutral-400 mt-2">Пункт подачи</label>
              <input
                value={orderDraft.pickup || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, pickup: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
                placeholder="Адрес подачи"
              />

              <label className="block text-xs text-neutral-400 mt-2">Пункт назначения</label>
              <input
                value={orderDraft.dropoff || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, dropoff: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
                placeholder="Адрес назначения"
              />

              <label className="block text-xs text-neutral-400 mt-2">Дата и время</label>
              <input
                value={orderDraft.datetime || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, datetime: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
                placeholder="22.08 14:00"
              />

              <label className="block text-xs text-neutral-400 mt-2">Класс авто</label>
              <select
                value={orderDraft.carClass || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, carClass: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
              >
                <option value="">Выберите класс</option>
                {carClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="block text-xs text-neutral-400 mt-2">Примечание</label>
              <textarea
                value={orderDraft.notes || ''}
                onChange={(e) => setOrderDraft({ ...orderDraft, notes: e.target.value })}
                className="w-full p-2 bg-neutral-800 rounded"
                rows={2}
                placeholder="Доп. пожелания"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 border border-white/10 rounded"
              >
                Отмена
              </button>
              <button
                onClick={submitOrder}
                className="px-4 py-2 bg-gold text-black rounded"
                disabled={sendingOrder || !orderDraft.name || !orderDraft.phone || !isValidPhone(orderDraft.phone)}
              >
                {sendingOrder ? 'Отправка...' : 'Подтвердить и отправить'}
              </button>
            </div>

            {!isValidPhone(orderDraft.phone) && (
              <div className="text-xs text-yellow-300 mt-2">Номер выглядит некорректно для выбранного формата.</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
