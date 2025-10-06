import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ message: 'Введите запрос.' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: 'Ключ OpenAI не найден.' }, { status: 500 })
    }

    // Отправляем запрос в OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Ты — вежливый AI-помощник компании Bvetra. Отвечай кратко и по делу, на русском языке, помогай с услугами и заказами трансфера.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      return NextResponse.json({ message: `Ошибка OpenAI: ${error}` }, { status: res.status })
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message?.content || 'Нет ответа от модели.'

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ message: 'Ошибка сервера.' }, { status: 500 })
  }
}
