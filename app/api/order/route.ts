import { NextResponse } from 'next/server'

type Order = {
  name: string
  phone: string
  pickup?: string
  dropoff?: string
  datetime?: string
  notes?: string
  carClass?: string
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const order: Order = payload.order
    const chatHistory: any[] = payload.chatHistory || []

    if (!order || !order.name || !order.phone) {
      return NextResponse.json({ ok: false, message: 'Имя и телефон обязательны' }, { status: 400 })
    }

    const results: any = { telegram: null, bitrix: null }

    // Telegram
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChatId = process.env.TELEGRAM_CHAT_ID
    if (tgToken && tgChatId) {
      try {
        const lines: string[] = []
        lines.push('Новый заказ (Bvetra):')
        lines.push(`Имя: ${order.name}`)
        lines.push(`Телефон: ${order.phone}`)
        if (order.pickup) lines.push(`Подача: ${order.pickup}`)
        if (order.dropoff) lines.push(`Назначение: ${order.dropoff}`)
        if (order.datetime) lines.push(`Время: ${order.datetime}`)
        if (order.carClass) lines.push(`Класс: ${order.carClass}`)
        if (order.notes) lines.push(`Примечание: ${order.notes}`)
        if (chatHistory?.length) {
          lines.push('')
          lines.push('История чата:')
          chatHistory.slice(-6).forEach((m: any) => {
            const who = m.role === 'user' ? 'Клиент' : m.role === 'assistant' ? 'AI' : m.role
            lines.push(`- ${who}: ${String(m.content).slice(0, 300)}`)
          })
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text: lines.join('\n') }),
        })
        results.telegram = await tgRes.json()
      } catch (e) {
        console.error('telegram error', e)
        results.telegram = { error: String(e) }
      }
    } else {
      results.telegram = { skipped: true, message: 'Telegram not configured' }
    }

    // Bitrix
    const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL || ''
    if (bitrixWebhook) {
      try {
        const fields: any = {
          TITLE: `Заказ: ${order.name}`,
          NAME: order.name,
          PHONE: order.phone ? [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }] : [],
          COMMENTS: [
            order.pickup ? `Подача: ${order.pickup}` : '',
            order.dropoff ? `Назначение: ${order.dropoff}` : '',
            order.datetime ? `Время: ${order.datetime}` : '',
            order.carClass ? `Класс: ${order.carClass}` : '',
            order.notes ? `Примечание: ${order.notes}` : '',
          ].filter(Boolean).join('\n'),
        }
        const body = { fields, params: { REGISTER_SONET_EVENT: 'Y' } }
        const url = `${bitrixWebhook.replace(/\/$/, '')}/crm.lead.add.json`
        const br = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        results.bitrix = await br.json()
      } catch (e) {
        console.error('bitrix error', e)
        results.bitrix = { error: String(e) }
      }
    } else {
      results.bitrix = { skipped: true, message: 'Bitrix not configured' }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('order route err', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
