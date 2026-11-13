import type { Metadata } from 'next'
import './globals.css'
import { TvModeRunner } from '@/components/TvMode'

export const metadata: Metadata = {
  title: 'Exacta Alerts',
  description: 'Real-time health metrics for the gaming system',
}

// Seconds each page shows in TV mode. Set TV_SECONDS_PER_PAGE in Amplify to change it.
const TV_SECONDS_PER_PAGE = Math.max(5, Number(process.env.TV_SECONDS_PER_PAGE) || 30)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <TvModeRunner seconds={TV_SECONDS_PER_PAGE} />
      </body>
    </html>
  )
}