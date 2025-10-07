import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: 'Server error: OpenAI key not configured' }, { status: 500 })
    }

    // System prompt: instruct assistant to collect order details step-by-step.
    const systemPrompt = `You are assistant for Bvetra corporate transfers. 
Guide user step-by-step to collect order: name, phone (any country), pickup, dropoff, datetime and car class (Standard, Comfort, Business, Minivan). 
When user confirms ("Yes", "Подтверждаю"), indicate that server should create an order and instruct client to POST to /api/order with collected fields.
Answer concisely and clearly.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.25,
        max_tokens: 400,
      }),
    })

    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? 'Извините, нет ответа'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('chat route error', err)
    return NextResponse.json({ reply: 'Server error' }, { status: 500 })
  }
}
