'use client'
import React from 'react'
export default function Drivers(){ const d=[{n:'Алексей',x:'10 лет'},{n:'Дмитрий',x:'VIP'},{n:'Сергей',x:'Маршруты'}]
  return (<section className="py-16"><div className="container"><h2 className="text-3xl font-bold text-gold mb-8">Наши водители</h2><div className="grid md:grid-cols-3 gap-6">{d.map((v,i)=>(<div key={i} className="card"><h3 className="text-xl font-semibold text-gold">{v.n}</h3><p className="mt-2 text-muted">{v.x}</p></div>))}</div></div></section>)}
