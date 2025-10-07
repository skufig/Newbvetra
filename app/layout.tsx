import './globals.css'
import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import SmartChat from './components/SmartChat'
import { ThemeLangProvider } from './context/ThemeLangContext'

export const metadata = {
  title: 'Bvetra — Корпоративные трансферы',
  description: 'Премиальные корпоративные трансферы',
  openGraph: {
    title: 'Bvetra',
    description: 'Премиальные корпоративные трансферы',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased transition-colors duration-300">
        <ThemeLangProvider>
          <Header />
          <main className="flex flex-col flex-1">{children}</main>
          <Footer />
          <div className="chat-widget">
            <SmartChat />
          </div>
        </ThemeLangProvider>
      </body>
    </html>
  )
}
