import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Destinasi Seimbang | DOSM Datathon 2026',
  description: 'Pelancongan Lestari Kemakmuran Bersama: Tourism pressure-to-prosperity intelligence for Malaysia.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230f3f39'/%3E%3Cpath d='M9 20c2-7 4-10 7-10s5 3 7 10' stroke='%239c6114' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3Ccircle cx='16' cy='10' r='2' fill='%239c6114'/%3E%3C/svg%3E",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The default UI language is English; LanguageProvider keeps this in sync
  // when the switcher is used, so screen readers use the right pronunciation.
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
