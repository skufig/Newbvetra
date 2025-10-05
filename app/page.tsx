'use client'
import React from 'react'
import Hero from './components/Hero'
import Services from './components/Services'
import Fleet from './components/Fleet'
import Drivers from './components/Drivers'
import Reviews from './components/Reviews'
import ContactForm from './components/ContactForm'
export default function Home(){ return (<main><Hero /><Services /><Fleet /><Drivers /><Reviews /><section className="container py-12"><div className="grid md:grid-cols-2 gap-6"><div className="card"><h3 className="text-gold text-lg font-semibold">Контакты</h3><p className="text-muted">Телефон: +7 (___) ___-__-__</p></div><div className="card"><ContactForm /></div></div></section></main>)}
