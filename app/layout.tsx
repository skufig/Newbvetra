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
      <body className="min-h-screen antialiased bg-white text-black dark:bg-graphite dark:text-white transition-colors duration-300">
        {/* Провайдер глобальной темы и языка */}
        <ThemeLangProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <SmartChat /> {/* AI-чат */}
        </ThemeLangProvider>
      </body>
    </html>
  )
}
