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
      return NextResponse.json(
        { ok: false, message: 'Имя и телефон обязательны' },
        { status: 400 }
      )
    }

    const results: any = { telegram: null, bitrix: null }

    // ==========================
    // 🟡 1) Telegram уведомление
    // ==========================
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChatId = process.env.TELEGRAM_CHAT_ID

    if (tgToken && tgChatId) {
      try {
        const textLines: string[] = [
          `🚖 *Новый заказ через AI-ассистента Bvetra!*`,
          ``,
          `👤 *Имя:* ${order.name}`,
          `📞 *Телефон:* ${order.phone}`,
          order.pickup ? `📍 *Подача:* ${order.pickup}` : '',
          order.dropoff ? `🎯 *Назначение:* ${order.dropoff}` : '',
          order.datetime ? `🕓 *Время:* ${order.datetime}` : '',
          order.carClass ? `🚘 *Класс авто:* ${order.carClass}` : '',
          order.notes ? `📝 *Примечание:* ${order.notes}` : '',
          ``,
          `💬 *История чата:*`,
        ].filter(Boolean)

        const lastMessages = chatHistory.slice(-6)
        for (const m of lastMessages) {
          const who =
            m.role === 'user'
              ? '👤 Клиент'
              : m.role === 'assistant'
              ? '🤖 AI'
              : '💬'
          textLines.push(`${who}: ${m.content}`)
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
      results.telegram = {
        skipped: true,
        message: 'TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не указаны',
      }
    }

    // ==========================
    // 🟢 2) Bitrix24 — создание лида
    // ==========================
    const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL || ''
    if (bitrixWebhook) {
      try {
        const fields: any = {
          TITLE: `Новый заказ через сайт — ${order.name}`,
          NAME: order.name,
          PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: [
            order.pickup ? `Подача: ${order.pickup}` : '',
            order.dropoff ? `Назначение: ${order.dropoff}` : '',
            order.datetime ? `Время: ${order.datetime}` : '',
            order.carClass ? `Класс авто: ${order.carClass}` : '',
            order.notes ? `Примечание: ${order.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        }

        const body = {
          fields,
          params: { REGISTER_SONET_EVENT: 'Y' },
        }

        const br = await fetch(
          `${bitrixWebhook.replace(/\/$/, '')}/crm.lead.add.json`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )

        results.bitrix = await br.json()
      } catch (e) {
        console.error('Bitrix error', e)
        results.bitrix = { error: String(e) }
      }
    } else {
      results.bitrix = {
        skipped: true,
        message: 'BITRIX_WEBHOOK_URL не задан — пропуск отправки',
      }
    }

    // ==========================
    // 🟣 3) Ответ клиенту
    // ==========================
    return NextResponse.json({
      ok: true,
      message: 'Заказ успешно отправлен',
      results,
    })
  } catch (err) {
    console.error('Order route error', err)
    return NextResponse.json(
      { ok: false, message: 'Ошибка сервера при обработке заказа' },
      { status: 500 }
    )
  }
}
