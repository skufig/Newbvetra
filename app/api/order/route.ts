import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const order = payload.order
    const chatHistory = payload.chatHistory || []

    if (!order || !order.name || !order.phone) return NextResponse.json({ ok:false, message:'Name and phone required' }, { status:400 })

    const results:any = { telegram:null, bitrix:null }
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChat = process.env.TELEGRAM_CHAT_ID

    if (tgToken && tgChat) {
      const lines = [
        `🚖 Новый заказ Bvetra`,
        `Клиент: ${order.name}`,
        `Телефон: ${order.phone}`,
        `Подача: ${order.pickup||'-'}`,
        `Назначение: ${order.dropoff||'-'}`,
        `Дата/Время: ${order.datetime||'-'}`,
        `Класс: ${order.class||'-'}`,
      ]
      if (order.notes) lines.push(`Примечание: ${order.notes}`)
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ chat_id: tgChat, text: lines.join('\n') })
        })
        results.telegram = await tgRes.json()
      } catch(e){ results.telegram = { error: String(e) } }
    } else results.telegram = { skipped:true }

    const bitrix = process.env.BITRIX_WEBHOOK_URL || ''
    if (bitrix) {
      try {
        const fields:any = {
          TITLE: `Заказ от ${order.name}`,
          NAME: order.name,
          PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `Подача: ${order.pickup||'-'}\nНазначение: ${order.dropoff||'-'}`
        }
        const br = await fetch(`${bitrix.replace(/\/$/,'')}/crm.lead.add.json`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ fields, params:{ REGISTER_SONET_EVENT:'Y' } })
        })
        results.bitrix = await br.json()
      } catch(e){ results.bitrix = { error: String(e) } }
    } else results.bitrix = { skipped:true }

    return NextResponse.json({ ok:true, results })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ ok:false, message:'Server error' }, { status:500 })
  }
}
