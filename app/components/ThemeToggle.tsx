'use client'
import React, { useEffect, useState } from 'react'
export default function ThemeToggle(){ const [theme,setTheme]=useState('dark')
 useEffect(()=>{ const t=localStorage.getItem('theme')||'dark'; setTheme(t); document.documentElement.dataset.theme=t },[])
 const toggle=()=>{ const n=theme==='dark'?'light':'dark'; setTheme(n); localStorage.setItem('theme',n); document.documentElement.dataset.theme=n }
 return (<button onClick={toggle} className="px-2 py-1 rounded bg-white/5">{theme==='dark'?'🌙':'☀️'}</button>)}
