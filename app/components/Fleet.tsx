'use client'
import React from 'react'
export default function Fleet(){ const cars=[{n:'Mercedes S-Class',d:'Бизнес'},{n:'BMW 7 Series',d:'Премиум'},{n:'Ford Transit',d:'Минивэн'}]
  return (<section id="fleet" className="py-16 bg-black"><div className="container"><h2 className="text-3xl font-bold text-gold mb-8">Автопарк</h2><div className="grid md:grid-cols-3 gap-6">{cars.map((c,i)=>(<div key={i} className="card"><h3 className="text-xl font-semibold text-gold">{c.n}</h3><p className="mt-2 text-muted">{c.d}</p></div>))}</div></div></section>)}
