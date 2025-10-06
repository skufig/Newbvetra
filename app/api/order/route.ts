import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { order, chatHistory } = await req.json()
    if (!order?.name || !order?.phone)
      return NextResponse.json({ message: 'Имя и телефон обязательны' }, { status: 400 })

    // Bitrix
    const bitrix = process.env.BITRIX_WEBHOOK_URL
    if (bitrix) {
      try {
        await fetch(`${bitrix.replace(/\/$/, '')}/crm.lead.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              TITLE: `Заказ от ${order.name}`,
              NAME: order.name,
              PHONE: [{ VALUE: order.phone, VALUE_TYPE: 'WORK' }],
              COMMENTS: `Подача: ${order.pickup}\nНазначение: ${order.dropoff}\nДата: ${order.datetime}\n${order.notes || ''}`,
            },
            params: { REGISTER_SONET_EVENT: 'Y' },
          }),
        })
      } catch (e) {
        console.error('Bitrix error', e)
      }
    }

    // Telegram
    const tgToken = process.env.TELEGRAM_BOT_TOKEN
    const tgChat = process.env.TELEGRAM_CHAT_ID
    if (tgToken && tgChat) {
      const text = `🚖 Новый заказ от ${order.name}\n📞 ${order.phone}\n🏁 ${order.pickup} → ${order.dropoff}\n🕒 ${order.datetime}\n📝 ${order.notes || ''}`
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 })
  }
}
