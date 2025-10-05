import './globals.css'
import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
export const metadata = { title: 'Bvetra — Корпоративные трансферы', description: 'Премиальные корпоративные трансферы', openGraph: { title: 'Bvetra', description: 'Премиальные корпоративные трансферы', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' } }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head />
      <body className="min-h-screen bg-graphite text-white antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
