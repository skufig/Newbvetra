'use client'
import React, { useEffect, useState } from 'react'
export default function Preloader(){ const [show,setShow]=useState(true); useEffect(()=>{ const t=setTimeout(()=>setShow(false),800); return ()=>clearTimeout(t) },[])
 if(!show) return null; return (<div className="fixed inset-0 flex items-center justify-center bg-black z-50"><div className="text-gold font-bold text-2xl">Bvetra</div></div>)}
