import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OpenAI API key missing' }, { status: 500 })

    const systemPrompt = `Ты — ассистент компании Bvetra. Отвечай вежливо на русском или английском.
Когда у тебя есть все поля для заказа, включи JSON заказа между маркерами:
---ORDER_JSON_START---
{ "name": "...", "phone":"...", "pickup":"...", "dropoff":"...", "datetime":"...", "passengers":1, "class":"Стандарт", "notes":"..." }
---ORDER_JSON_END---
`
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m:any)=>({ role: m.role==='user'?'user':'assistant', content: m.content })),
      { role: 'user', content: message }
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.2, max_tokens: 900 })
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('OpenAI error', txt)
      return NextResponse.json({ error: 'OpenAI request failed' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const START = '---ORDER_JSON_START---'
    const END = '---ORDER_JSON_END---'
    let order = null
    let reply = raw
    const s = raw.indexOf(START), e = raw.indexOf(END)
    if (s!==-1 && e!==-1 && e>s) {
      const js = raw.slice(s+START.length, e).trim()
      try { order = JSON.parse(js) } catch(err){ console.warn('parse order',err) }
      reply = (raw.slice(0,s)+raw.slice(e+END.length)).trim()
    }
    return NextResponse.json({ reply, order })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
