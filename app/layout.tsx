import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Exacta Alerts',
  description: 'Real-time health metrics for the gaming system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}