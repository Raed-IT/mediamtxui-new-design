import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'MediaMTX Dashboard', description: 'MediaMTX MVC RBAC Dashboard' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
