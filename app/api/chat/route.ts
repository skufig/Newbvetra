import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey)
      return NextResponse.json({ reply: 'OpenAI API ключ не найден' }, { status: 500 })

    const messages = [
      {
        role: 'system',
        content:
          'Ты — ассистент компании Bvetra. Помогаешь оформить трансфер, отвечаешь вежливо и по делу.',
      },
      ...history.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.2,
      }),
    })

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Нет ответа'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: 'Ошибка сервера' }, { status: 500 })
  }
}
