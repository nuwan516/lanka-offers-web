import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { I18nProvider } from '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Lanka Offers - Sri Lanka Bank Card Offers & Deals',
  description:
    'Discover verified credit and debit card offers, dining discounts, 1-for-1 deals, and installment plans across Sri Lanka banks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <I18nProvider>
            <div className="flex min-h-svh flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <Footer />
              <MobileNav />
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
