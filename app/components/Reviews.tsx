'use client'
import React from 'react'
export default function Reviews(){ const r=[{n:'Екатерина',t:'Отличный сервис'},{n:'Илья',t:'Пунктуально'},{n:'Мария',t:'Рекомендую'}]
  return (<section className="py-16 bg-black"><div className="container"><h2 className="text-3xl font-bold text-gold mb-8">Отзывы</h2><div className="grid md:grid-cols-3 gap-6">{r.map((it,i)=>(<div key={i} className="card"><p className="text-muted">“{it.t}”</p><h4 className="mt-3 text-gold font-semibold">{it.n}</h4></div>))}</div></div></section>)}
