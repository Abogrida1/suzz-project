import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Healthy Food Delivery - Admin Dashboard',
  description: 'Admin dashboard for managing restaurants, orders, and deliveries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}
        style={{ fontFamily: 'Inter, Arial, sans-serif', color: '#1f2937', direction: 'rtl' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
