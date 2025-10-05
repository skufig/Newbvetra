import Link from 'next/link'
export default function NotFound(){ return (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-6xl font-bold">404</h1><p className="mt-4">Страница не найдена</p><div className="mt-6"><Link href="/">На главную</Link></div></div></div>)}
