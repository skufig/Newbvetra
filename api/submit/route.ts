import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, fields } = body || {}
  const BITRIX = process.env.BITRIX_WEBHOOK_URL || ''
  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
  const TG_CHAT = process.env.TELEGRAM_CHAT_ID || ''
  const title = `Заявка с сайта — ${type || 'site'}`
  const bitrixFields: any = { TITLE: title, NAME: fields?.name || '', PHONE: fields?.phone ? [{ VALUE: fields.phone, VALUE_TYPE: 'WORK' }] : [], COMMENTS: fields?.message || fields?.about || '' }
  if (fields?.service) bitrixFields.COMMENTS = (bitrixFields.COMMENTS || '') + '\nУслуга: ' + fields.service
  try {
    if (BITRIX) {
      const url = BITRIX.includes('crm.lead.add') ? BITRIX : BITRIX.replace(/\/$/,'') + '/crm.lead.add.json'
      await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fields: bitrixFields, params: { REGISTER_SONET_EVENT: 'Y' } }) })
    }
    if (TG_TOKEN && TG_CHAT) {
      const text = `Новая заявка: ${title}\nИмя: ${fields?.name || ''}\nТел: ${fields?.phone || ''}\nСообщение: ${fields?.message || fields?.about || ''}`
      const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`
      await fetch(tgUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' }) })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
