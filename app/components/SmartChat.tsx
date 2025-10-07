'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  MessageCircle,
  X,
  Trash,
  Mic,
  MicOff,
  Check,
  Phone,
  MapPin,
  Calendar,
  User,
} from 'lucide-react'
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js'

type Msg = { role: 'user' | 'assistant' | 'system' | 'order'; content: string }
type OrderShape = {
  name?: string
  phone?: string
  pickup?: string
  dropoff?: string
  datetime?: string
  notes?: string
  carClass?: 'Standard' | 'Business' | 'Premium' | 'Minivan'
}

const CAR_CLASSES: { id: OrderShape['carClass']; labelRu: string; labelEn: string; hint: string }[] = [
  { id: 'Standard', labelRu: 'Standard', labelEn: 'Standard', hint: 'Комфортный, экономичный' },
  { id: 'Business', labelRu: 'Business', labelEn: 'Business', hint: 'Деловой уровень' },
  { id: 'Premium', labelRu: 'Premium', labelEn: 'Premium', hint: 'Максимум комфорта' },
  { id: 'Minivan', labelRu: 'Minivan', labelEn: 'Minivan', hint: 'Для групп и багажа' },
]

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

  const [orderPreview, setOrderPreview] = useState<OrderShape | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [orderSending, setOrderSending] = useState(false)
  const [orderResult, setOrderResult] = useState<string | null>(null)

  const [isFocused, setIsFocused] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // load history
  useEffect(() => {
    const raw = localStorage.getItem('bvetra_chat_history')
    if (raw) {
      try {
        setMessages(JSON.parse(raw))
      } catch {
        setMessages([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('bvetra_chat_history', JSON.stringify(messages))
    // auto-scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 500
    }
  }, [messages])

  // speech recognition
  useEffect(() => {
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setInput((prev) => (prev ? prev + ' ' + text : text))
    }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
  }, [])

  // keyboard offset for mobile
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

  // main send message flow: sends to /api/chat and appends AI reply
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
      const reply = data.reply || data.message || 'Нет ответа от AI'
      append({ role: 'assistant', content: reply })

      // try to extract order proposal after assistant reply
      setTimeout(() => {
        const proposed = extractOrderFromConversation([...messages, { role: 'assistant', content: reply }])
        if (proposed) {
          // show confirmation UI (pre-filled)
          setOrderPreview((prev) => ({ ...prev, ...proposed }))
          setConfirmOpen(true)
          // also add assistant note inviting to confirm
          append({
            role: 'assistant',
            content:
              'Похоже, вы хотите оформить трансфер — я собрал данные. Проверьте, пожалуйста, и подтвердите заказ (нажмите "Оформить").',
          })
        }
      }, 400)
    } catch (e) {
      console.error(e)
      append({ role: 'assistant', content: 'Ошибка при обращении к серверу' })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('bvetra_chat_history')
    setOrderPreview(null)
    setOrderResult(null)
  }

  // phone formatter (as-you-type)
  const formatPhoneAsYouType = (val: string) => {
    try {
      const formatter = new AsYouType()
      formatter.input(val)
      return formatter.formattedOutput || val
    } catch {
      return val
    }
  }

  // phone validation utility
  const validatePhone = (phone: string) => {
    try {
      const pn = parsePhoneNumberFromString(phone)
      return pn ? pn.isValid() : !!phone.match(/\d{6,}/)
    } catch {
      return !!phone.match(/\d{6,}/)
    }
  }

  // --- extract order heuristics: scans recent messages for likely fields ---
  function extractOrderFromConversation(conv: Msg[]): Partial<OrderShape> | null {
    // We'll look at the last N messages (user + assistant)
    const last = conv.slice(-8).map((m) => m.content).join('\n')
    const lower = last.toLowerCase()

    // quick checks: must mention booking intent words
    const intentKeywords = ['заказ', 'трансфер', 'забрать', 'поехать', 'взять', 'book', 'transfer', 'airport', 'аэропорт', 'встреча']
    const hasIntent = intentKeywords.some((k) => lower.includes(k))
    if (!hasIntent) return null

    const result: Partial<OrderShape> = {}

    // PHONE: any sequence with + and digits or long digit sequences
    const phoneMatch = last.match(/(\+?\d[\d\-\s().]{6,}\d)/)
    if (phoneMatch) {
      result.phone = formatPhoneAsYouType(phoneMatch[0])
    }

    // NAME: "меня зовут <Name>", "я <Name>", "i am <Name>"
    let nameMatch =
      last.match(/меня зовут\s+([A-ZА-ЯЁ][A-Za-zА-Яа-яё\- ]{1,30})/i) ||
      last.match(/\bя\s+([A-ZА-ЯЁ][A-Za-zА-Яа-яё\- ]{1,30})\b/i) ||
      last.match(/\bi am\s+([A-Z][A-Za-z\- ]{1,30})\b/i) ||
      last.match(/\bim\s+([A-Z][A-Za-z\- ]{1,30})\b/i)
    if (nameMatch) result.name = nameMatch[1].trim()

    // pickup & dropoff: patterns like "из A в B", "from A to B", "забрать из A, в B"
    const fromToMatch = last.match(/(?:из|from)\s+([^,.;\n]+?)\s+(?:в|to)\s+([^,.;\n]+)/i)
    if (fromToMatch) {
      result.pickup = fromToMatch[1].trim()
      result.dropoff = fromToMatch[2].trim()
    } else {
      // try "забрать из A" and "в B"
      const pickupMatch = last.match(/(?:забрать из|подать в|подать на|pick up from|pickup from)\s+([^,.;\n]+)/i)
      const dropoffMatch = last.match(/(?:в|to|въезд|до)\s+([^,.;\n]+)/i)
      if (pickupMatch) result.pickup = pickupMatch[1].trim()
      if (dropoffMatch) result.dropoff = dropoffMatch[1].trim()
    }

    // datetime: look for "завтра", "сегодня", explicit date/time, or patterns like "10:30", "с 10"
    const dateMatch =
      last.match(/(?:в\s)?\b(\d{1,2}[:.]\d{2})\b/) ||
      last.match(/\b(завтра|сегодня|послезавтра)\b/i) ||
      last.match(/\b(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))\b/i) ||
      last.match(/\b(on|at)\s+([A-Za-z0-9, ]{3,40})\b/i)
    if (dateMatch) result.datetime = dateMatch[0].trim()

    // car class recognition (words like business, premium, комфорт)
    const classMap: Record<string, OrderShape['carClass']> = {
      'business': 'Business',
      'бизнес': 'Business',
      'premium': 'Premium',
      'премиум': 'Premium',
      'vip': 'Premium',
      'minivan': 'Minivan',
      'вэн': 'Minivan',
      'минивэн': 'Minivan',
      'van': 'Minivan',
      'standard': 'Standard',
      'стандарт': 'Standard',
      'комфорт': 'Standard',
    }
    for (const key in classMap) {
      if (lower.includes(key)) {
        result.carClass = classMap[key]
        break
      }
    }

    // notes: any sentence containing "багаж", "встреча", etc.
    const notes: string[] = []
    if (lower.includes('багаж')) notes.push('Есть багаж')
    if (lower.includes('встреча')) notes.push('Встреча')
    if (lower.includes('пояснение')) notes.push('Доп. инфо')
    if (notes.length) result.notes = notes.join('; ')

    // if at least phone or pickup/dropoff or name found -> consider a proposal
    if (result.phone || result.pickup || result.dropoff || result.name || result.datetime || result.carClass) {
      return result
    }
    return null
  }

  // user clicks "choose car class" -> append a message and set orderPreview
  const chooseCarClass = (c: OrderShape['carClass']) => {
    append({ role: 'user', content: `Класс авто: ${c}` })
    setOrderPreview((p) => ({ ...(p || {}), carClass: c }))
  }

  // confirm and send order (calls /api/order)
  const confirmAndSend = async () => {
    if (!orderPreview) return
    // basic phone validation
    const phoneOk = orderPreview.phone ? validatePhone(orderPreview.phone) : false
    if (!phoneOk) {
      setOrderResult('Проверьте, пожалуйста, телефонный номер')
      return
    }

    setOrderSending(true)
    setOrderResult(null)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderPreview, chatHistory: messages }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrderResult('✅ Заказ успешно отправлен!')
        // append order record to messages
        append({
          role: 'order',
          content: `Заказ: ${orderPreview.name || '-'} ${orderPreview.phone || '-'} ${orderPreview.pickup || '-'} → ${orderPreview.dropoff || '-'} ${orderPreview.datetime || ''} (${orderPreview.carClass || '-'})`,
        })
        setConfirmOpen(false)
        setOrderPreview(null)
      } else {
        setOrderResult(data.message || 'Ошибка при отправке')
      }
    } catch (e) {
      console.error(e)
      setOrderResult('Ошибка соединения')
    } finally {
      setOrderSending(false)
    }
  }

  // small UI helpers
  const bottomStyle = 20 + (keyboardOffset > 0 ? keyboardOffset : 0)

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gold text-black p-4 rounded-full shadow-2xl hover:scale-105 transform transition"
          title="Открыть AI-чат"
        >
          <MessageCircle size={22} />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div
              style={{ bottom: bottomStyle }}
              className="fixed right-6 z-50 w-[420px] max-w-[94vw] rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-[#0b0b0c]/95 border border-white/6 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-white/6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle />
                    <div className="text-sm font-semibold">AI ассистент</div>
                    <div className="text-xs ml-2 text-white/60">Bvetra</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-white/5" onClick={clearChat} title="Очистить чат">
                      <Trash size={16} />
                    </button>
                    <button className="p-1 rounded hover:bg-white/5" onClick={() => setOpen(false)} title="Закрыть">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div ref={scrollRef} className="h-[52vh] max-h-[60vh] overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-white/60 text-sm">
                      Привет! Я помогу заказать трансфер — просто опишите, откуда и куда, или задайте вопрос.
                    </div>
                  )}

                  {messages.map((m, idx) => (
                    <div key={idx} className="w-full flex">
                      {m.role === 'user' ? (
                        <div className="ml-auto bg-gold text-black px-3 py-2 rounded-2xl max-w-[80%] text-sm">
                          {m.content}
                        </div>
                      ) : m.role === 'assistant' ? (
                        <div className="bg-zinc-800 text-white px-3 py-2 rounded-2xl max-w-[85%] text-sm">
                          {m.content}
                        </div>
                      ) : m.role === 'order' ? (
                        <div className="bg-white/5 text-white px-3 py-2 rounded-2xl max-w-[85%] text-sm">
                          {m.content}
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {/* If an orderPreview exists, show compact preview inside chat */}
                  {orderPreview && (
                    <div className="bg-white/5 p-3 rounded-lg text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Черновик заказа</div>
                        <div className="text-xs text-white/60">Проверьте перед отправкой</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2"><User size={14} /> {orderPreview.name || '—'}</div>
                        <div className="flex items-center gap-2"><Phone size={14} /> {orderPreview.phone || '—'}</div>
                        <div className="flex items-center gap-2"><MapPin size={14} /> {orderPreview.pickup || '—'}</div>
                        <div className="flex items-center gap-2"><MapPin size={14} /> {orderPreview.dropoff || '—'}</div>
                        <div className="flex items-center gap-2"><Calendar size={14} /> {orderPreview.datetime || '—'}</div>
                        <div className="flex items-center gap-2">Класс: {orderPreview.carClass || '—'}</div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setConfirmOpen(true)}
                          className="flex-1 bg-gold text-black px-3 py-2 rounded-lg font-semibold"
                        >
                          Оформить
                        </button>
                        <button
                          onClick={() => {
                            setOrderPreview(null)
                            setConfirmOpen(false)
                          }}
                          className="flex-1 border border-white/10 px-3 py-2 rounded-lg"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Car class quick buttons (show when bot asks or always visible) */}
                  <div className="flex flex-wrap gap-2">
                    {CAR_CLASSES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => chooseCarClass(c.id)}
                        className="text-xs bg-white/5 px-3 py-1 rounded-full hover:bg-white/10 transition"
                        title={c.hint}
                      >
                        {c.labelRu}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 border-t border-white/6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => (listening ? stopListening() : startListening())}
                      className="p-2 rounded-lg hover:bg-white/5"
                      title="Голосовой ввод"
                    >
                      {listening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Напишите сообщение..."
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                      className="flex-1 bg-zinc-900 border border-white/6 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold transition"
                    />

                    <button
                      onClick={() => sendMessage()}
                      disabled={loading}
                      className="ml-2 bg-gold text-black px-3 py-2 rounded-xl"
                      title="Отправить"
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  {/* quick replies */}
                  <div className="mt-2 flex flex-wrap gap-2">
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
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal (edit before sending) */}
      <AnimatePresence>
        {confirmOpen && orderPreview && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmOpen(false)}
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 16, stiffness: 220 }}
              className="relative z-50 w-[92vw] max-w-md bg-zinc-900/95 border border-white/8 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Проверьте заказ</h3>
                <button onClick={() => setConfirmOpen(false)} className="p-1 rounded hover:bg-white/5"><X size={18} /></button>
              </div>

              <div className="space-y-2 text-sm">
                <label className="block">
                  <div className="text-xs text-white/60 mb-1">Имя</div>
                  <input
                    value={orderPreview.name || ''}
                    onChange={(e) => setOrderPreview({ ...orderPreview, name: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60 mb-1">Телефон</div>
                  <input
                    value={orderPreview.phone || ''}
                    onChange={(e) => setOrderPreview({ ...orderPreview, phone: formatPhoneAsYouType(e.target.value) })}
                    className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                    placeholder="+7 900 000 00 00"
                  />
                </label>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label>
                    <div className="text-xs text-white/60 mb-1">Подача</div>
                    <input
                      value={orderPreview.pickup || ''}
                      onChange={(e) => setOrderPreview({ ...orderPreview, pickup: e.target.value })}
                      className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                    />
                  </label>
                  <label>
                    <div className="text-xs text-white/60 mb-1">Назначение</div>
                    <input
                      value={orderPreview.dropoff || ''}
                      onChange={(e) => setOrderPreview({ ...orderPreview, dropoff: e.target.value })}
                      className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-xs text-white/60 mb-1">Дата и время</div>
                  <input
                    value={orderPreview.datetime || ''}
                    onChange={(e) => setOrderPreview({ ...orderPreview, datetime: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                    placeholder="Например: завтра 10:00"
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60 mb-1">Класс автомобиля</div>
                  <div className="flex gap-2 flex-wrap">
                    {CAR_CLASSES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setOrderPreview({ ...orderPreview, carClass: c.id })}
                        className={`px-3 py-1 rounded-full text-sm ${orderPreview.carClass === c.id ? 'bg-gold text-black' : 'bg-white/5'}`}
                      >
                        {c.labelRu}
                      </button>
                    ))}
                  </div>
                </label>

                <label>
                  <div className="text-xs text-white/60 mb-1">Примечание</div>
                  <textarea
                    value={orderPreview.notes || ''}
                    onChange={(e) => setOrderPreview({ ...orderPreview, notes: e.target.value })}
                    className="w-full p-2 rounded bg-zinc-800 border border-white/6"
                    rows={3}
                  />
                </label>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={confirmAndSend}
                  disabled={orderSending}
                  className="flex-1 bg-gold text-black px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Check size={16} /> {orderSending ? 'Отправка...' : 'Подтвердить и отправить'}
                </button>
                <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-white/8">Отмена</button>
              </div>

              {orderResult && <div className="mt-3 text-sm text-white/80">{orderResult}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
