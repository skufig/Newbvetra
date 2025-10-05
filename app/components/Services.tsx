'use client'
import React from 'react'
export default function Services(){ const items=[{t:'Бизнес‑трансфер',d:'Для корпоративных клиентов'},{t:'Аэропорт‑сервис',d:'Встреча и доставка'},{t:'Мероприятия',d:'Корпоративные события'}]
  return (<section id="services" className="py-16"><div className="container"><h2 className="text-3xl font-bold text-gold mb-8">Наши услуги</h2><div className="grid md:grid-cols-3 gap-6">{items.map((s,i)=>(<div key={i} className="card"><h3 className="text-xl font-semibold text-gold">{s.t}</h3><p className="mt-2 text-muted">{s.d}</p></div>))}</div></div></section>)}
