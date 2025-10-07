// app/api/order/route.ts
import { NextResponse } from 'next/server'

type Order = {
  name: string
  phone: string
  pickup?: string
  dropoff?: string
  datetime?: string
  notes?: string
  carClass?: string
  passengers?: number | string
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
    const tgToken = process.env.TELEGRAM_BOT_TOKEN || ''
    const tgChatId = process.env.TELEGRAM_CHAT_ID || ''
    if (tgToken && tgChatId) {
      try {
        const lines = [
          `🚖 *Новый заказ Bvetra*`,
          `*Клиент:* ${order.name}`,
          `*Телефон:* ${order.phone}`,
          `*Подача:* ${order.pickup || '-'}`,
          `*Назначение:* ${order.dropoff || '-'}`,
          `*Дата/Время:* ${order.datetime || '-'}`,
          `*Класс авто:* ${order.carClass || '-'}`,
          `*Пассажиры:* ${order.passengers || '-'}`,
          `*Примечание:* ${order.notes || '-'}`,
        ]
        if (chatHistory?.length) {
          lines.push('', '*История чата:*')
          const last = chatHistory.slice(-6)
          last.forEach((m: any) => {
            const who = m.role === 'user' ? 'Пользователь' : m.role === 'assistant' ? 'AI' : m.role
            lines.push(`- ${who}: ${String(m.content).slice(0, 300)}`)
          })
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: lines.join('\n'),
            parse_mode: 'Markdown',
          }),
        })
        results.telegram = await tgRes.json()
      } catch (e) {
        results.telegram = { error: String(e) }
      }
    } else {
      results.telegram = { skipped: true, message: 'telegram env not set' }
    }

    // Bitrix
    const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL || ''
    if (bitrixWebhook) {
      try {
        const fields: any = {
          TITLE: `Заказ от ${order.name}`,
          NAME: order.name,
          PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `Подача: ${order.pickup || '-'}\nНазначение: ${order.dropoff || '-'}\nДата/Время: ${order.datetime || '-'}\nКласс: ${order.carClass || '-'}\nПассажиры: ${order.passengers || '-'}\nПримечание: ${order.notes || '-'}`,
        }
        const br = await fetch(`${bitrixWebhook.replace(/\/$/, '')}/crm.lead.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } }),
        })
        results.bitrix = await br.json()
      } catch (e) {
        results.bitrix = { error: String(e) }
      }
    } else {
      results.bitrix = { skipped: true, message: 'BITRIX_WEBHOOK_URL not set' }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
