import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ reply: 'OpenAI API key not configured' }, { status: 500 })

    const messages = [
      { role: 'system', content: 'Ты — виртуальный ассистент компании Bvetra. Отвечай дружелюбно и по делу. Если пользователь просит оформить заказ, предложи кнопку "Оформить заказ".' },
      ...history.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
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
        max_tokens: 800,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ reply: `OpenAI error: ${text}` }, { status: res.status })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Нет ответа'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat route error', err)
    return NextResponse.json({ reply: 'Server error' }, { status: 500 })
  }
}
