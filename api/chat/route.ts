import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body?.message || ''
  const OPENAI = process.env.OPENAI_API_KEY || ''
  if (!OPENAI) return NextResponse.json({ reply: 'Привет! Я здесь чтобы помочь. (OpenAI API не настроен).' })
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: message }], max_tokens: 500 })
    })
    const data = await r.json()
    const reply = data?.choices?.[0]?.message?.content || 'Извините, нет ответа'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ reply: 'Ошибка при обработке запроса' }, { status: 500 })
  }
}
