'use client'
import Link from 'next/link'
export default function LangToggle(){ return (<div className="flex items-center gap-2"><Link href="/en"><a className="px-2 py-1">EN</a></Link><Link href="/"><a className="px-2 py-1">RU</a></Link></div>)}
