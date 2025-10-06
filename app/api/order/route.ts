
import { NextResponse } from 'next/server'

type Order = {
  name: string
  phone: string
  pickup: string
  dropoff: string
  datetime?: string
  notes?: string
}

export async function POST(req: Request) {
  try {
    const { order, chatHistory } = await req.json() as { order: Order, chatHistory?: any[] }

    // validate
    if (!order?.name || !order?.phone) {
      return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 })
    }

    // 1) Send to Bitrix (if configured)
    const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL // full webhook base URL, e.g. https://<domain>/rest/<user>/<webhook>/
    let bitrixResult: any = null
    if (bitrixWebhook) {
      try {
        // Prepare fields for lead
        const fields: any = {
          TITLE: `Заказ от ${order.name}`,
          NAME: order.name,
          PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `Подача: ${order.pickup}\nНазначение: ${order.dropoff}\nДата/время: ${order.datetime || '-'}\nПримечание: ${order.notes || '-'}\n\nИз чата:\n${chatHistory?.map((m:any)=>`${m.role}: ${m.content}`).join('\n') || ''}`
        }

        // Bitrix REST expects a POST to `${bitrixWebhook}/crm.lead.add.json` with body { fields }
        const br = await fetch(`${bitrixWebhook.replace(/\/$/, '')}/crm.lead.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } }),
        })
        bitrixResult = await br.json()
      } catch (e) {
        console.error('Bitrix error', e)
      }
    }

    // 2) Send to Telegram (if configured)
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChat = process.env.TELEGRAM_CHAT_ID
    let tgResult: any = null
    if (tgToken && tgChat) {
      try {
        const text = `Новый заказ от ${order.name}\nТелефон: ${order.phone}\nПодача: ${order.pickup}\nНазначение: ${order.dropoff}\nВремя: ${order.datetime || '-'}\nПримечание: ${order.notes || '-'}`
        const url = `https://api.telegram.org/bot${tgToken}/sendMessage`
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChat, text, parse_mode: 'HTML' }),
        })
        tgResult = await r.json()
      } catch (e) {
        console.error('Telegram error', e)
      }
    }

    // Return success with info
    return NextResponse.json({ success: true, bitrix: bitrixResult, telegram: tgResult })
  } catch (err) {
    console.error('Order API error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
