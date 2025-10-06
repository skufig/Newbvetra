// app/api/order/route.ts
import { NextResponse } from 'next/server'

type Order = {
  name: string
  phone: string
  pickup?: string
  dropoff?: string
  datetime?: string
  notes?: string
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

    // --------------------
    // 1) Telegram notify
    // --------------------
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChatId = process.env.TELEGRAM_CHAT_ID

    if (tgToken && tgChatId) {
      try {
        const textLines = [
          `🚖 *Новый заказ Bvetra*`,
          `*Клиент:* ${order.name}`,
          `*Телефон:* ${order.phone}`,
        ]
        if (order.pickup) textLines.push(`*Подача:* ${order.pickup}`)
        if (order.dropoff) textLines.push(`*Назначение:* ${order.dropoff}`)
        if (order.datetime) textLines.push(`*Время:* ${order.datetime}`)
        if (order.notes) textLines.push(`*Примечание:* ${order.notes}`)
        if (chatHistory && chatHistory.length) {
          textLines.push('', '*История чата:*')
          const last = chatHistory.slice(-6) // последние 6 сообщений
          last.forEach((m: any) => {
            const who = m.role === 'user' ? 'Пользователь' : m.role === 'assistant' ? 'AI' : m.role
            textLines.push(`- ${who}: ${String(m.content).slice(0, 300)}`)
          })
        }

        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: textLines.join('\n'),
            parse_mode: 'Markdown',
          }),
        })
        results.telegram = await tgRes.json()
      } catch (e) {
        console.error('Telegram send error', e)
        results.telegram = { error: String(e) }
      }
    } else {
      results.telegram = { skipped: true, message: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set' }
    }

    // --------------------
    // 2) Bitrix lead create
    // --------------------
    // EXPECTED: BITRIX_WEBHOOK_URL = "https://<your-domain>.bitrix24.ru/rest/<userId>/<webhookToken>"
    // We'll call: `${BITRIX_WEBHOOK_URL}/crm.lead.add.json`
    const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL || '' // can be empty
    if (bitrixWebhook) {
      try {
        const fields: any = {
          TITLE: `Заказ от ${order.name}`,
          NAME: order.name,
          PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `Подача: ${order.pickup || '-'}\nНазначение: ${order.dropoff || '-'}\nВремя: ${order.datetime || '-'}\nПримечание: ${order.notes || '-'}`,
          // дополнительные поля можно добавить тут
        }

        const body = { fields, params: { REGISTER_SONET_EVENT: 'Y' } }

        const br = await fetch(`${bitrixWebhook.replace(/\/$/, '')}/crm.lead.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        results.bitrix = await br.json()
      } catch (e) {
        console.error('Bitrix error', e)
        results.bitrix = { error: String(e) }
      }
    } else {
      // если webhook не задан — возвращаем рандомный заглушечный ответ (как ты просил)
      results.bitrix = { skipped: true, message: 'BITRIX_WEBHOOK_URL not set — placeholder used' }
    }

    // --------------------
    // 3) Ответ клиенту
    // --------------------
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('order route error', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
