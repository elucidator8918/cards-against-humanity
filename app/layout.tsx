import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cards Against Humanity Online',
  description: 'Play Cards Against Humanity with friends online in a fun and hilarious multiplayer experience.',
  author: 'Siddhant',
  keywords: ['Cards Against Humanity', 'party game', 'multiplayer', 'fun card game'],
  themeColor: '#000000'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
