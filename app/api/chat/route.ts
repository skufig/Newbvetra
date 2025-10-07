import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey)
      return NextResponse.json({ reply: 'Ошибка: отсутствует OpenAI API ключ' }, { status: 500 })

    // ================================
    // 1️⃣ Определяем контекст разговора
    // ================================
    const systemPrompt = `
Ты — доброжелательный ассистент компании Bvetra, помогаешь клиенту оформить заказ на трансфер.
Всегда пиши вежливо, коротко и с эмодзи.
Ты ведёшь клиента шаг за шагом:
1. Узнай его имя.
2. Узнай номер телефона (любой страны, не только +7).
3. Узнай точку подачи (откуда ехать).
4. Узнай точку назначения (куда ехать).
5. Спроси дату и время поездки.
6. Предложи выбрать класс автомобиля:
   - 🚗 Стандарт
   - 🚘 Комфорт
   - 🏎 Бизнес
   - 🚖 Премиум
7. Покажи пользователю всё, что он указал, и спроси: “Всё верно? Подтвердить заказ?”
8. После подтверждения — скажи, что заказ оформлен, и отправь данные на сервер через /api/order.

Если пользователь просит внести изменения — обнови нужные поля и снова покажи сводку.
Отвечай на русском, если язык браузера ru, иначе на английском.
Не используй markdown, просто структурируй ответ строками.
`

    // ================================
    // 2️⃣ Формируем запрос к OpenAI API
    // ================================
    const messages = [
      { role: 'system', content: systemPrompt },
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
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? 'Извини, я не понял вопрос 😅'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json({ reply: 'Ошибка сервера при обращении к модели 🤖' }, { status: 500 })
  }
}
