// app/api/chat/stream/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history = [] } = body || {}
    const OPENAI_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })

    // Compose messages
    const messages = [
      { role: 'system', content: 'Ты — вежливый ассистент Bvetra. Помогаешь оформить трансфер, собираешь данные: имя, телефон, пункт подачи, пункт назначения, дату/время, класс авто, количество пассажиров, примечания. Если получил все данные — собери JSON с полем order и отправь его в блоке ```json ... ``` для автоматического захвата.' },
      ...history.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    const streamRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // можно заменить
        messages,
        temperature: 0.2,
        stream: true,
      }),
    })

    if (!streamRes.ok) {
      const txt = await streamRes.text()
      return NextResponse.json({ error: txt }, { status: 500 })
    }

    // pipe response stream to client
    const reader = (streamRes.body as ReadableStream<Uint8Array>).getReader()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
        controller.close()
        reader.releaseLock()
      },
    })

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
