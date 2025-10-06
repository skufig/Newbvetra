'use client'

import { useState } from 'react'
import { Send, MessageCircle, X } from 'lucide-react'

export default function Chat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, history: messages }),
    })
    const data = await res.json()
    setMessages([...messages, userMessage, { role: 'assistant', content: data.reply }])
  }

  return (
    <>
      {open ? (
        <div className="fixed bottom-5 right-5 w-80 bg-neutral-900 border border-neutral-700 rounded-2xl p-3 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm">AI-ассистент</h3>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div className="h-64 overflow-y-auto space-y-2 text-sm mb-2">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2 rounded-xl ${msg.role === 'user' ? 'bg-gold text-black ml-auto max-w-[80%]' : 'bg-neutral-800 text-white max-w-[85%]'}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1 bg-neutral-800 text-white text-sm rounded-xl px-3 py-2 outline-none"
            />
            <button onClick={sendMessage} className="bg-gold text-black p-2 rounded-xl"><Send size={16} /></button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 bg-gold text-black p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle />
        </button>
      )}
    </>
  )
}
