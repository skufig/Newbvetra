'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import LangToggle from './LangToggle'
export default function Header(){ const [open,setOpen]=useState(false)
  return (<header className="bg-black/80 sticky top-0 z-40 border-b border-white/5"><div className="container flex items-center justify-between py-4"><div className="flex items-center gap-6"><Link href="/"><a className="text-xl font-bold">Bvetra</a></Link><nav className="hidden md:flex gap-4 text-muted"><a href="#about">О нас</a><a href="#services">Услуги</a><a href="#fleet">Автопарк</a><Link href="/vacancies"><a>Вакансии</a></Link></nav></div><div className="flex items-center gap-3"><button onClick={()=>window.dispatchEvent(new CustomEvent('openModal'))} className="btn btn-primary">Заказать трансфер</button><LangToggle /><ThemeToggle /><button className="md:hidden" onClick={()=>setOpen(s=>!s)}>☰</button></div></div>{open&&(<div className="md:hidden bg-black/90"><div className="px-4 py-4 flex flex-col gap-2"><a href="#about">О нас</a><a href="#services">Услуги</a><a href="#fleet">Автопарк</a><Link href="/vacancies"><a>Вакансии</a></Link></div></div>)}</header>)}
