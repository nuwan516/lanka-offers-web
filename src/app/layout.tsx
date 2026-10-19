import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { I18nProvider } from '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const sinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  variable: '--font-sinhala',
  display: 'swap',
})
const tamil = Noto_Sans_Tamil({ subsets: ['tamil'], variable: '--font-tamil', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Lanka Offers - Sri Lanka Bank Card Offers',
    template: '%s | Lanka Offers',
  },
  description:
    'Find current credit and debit card offers from Sri Lankan banks: dining, hotels, groceries and more, with validity dates and original bank sources.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sinhala.variable} ${tamil.variable}`}
    >
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <I18nProvider>
            <div className="flex min-h-svh flex-col">
              <Header />
              <main id="main" className="flex-1 pb-20 md:pb-0">
                {children}
              </main>
              <Footer />
              <MobileNav />
            </div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
