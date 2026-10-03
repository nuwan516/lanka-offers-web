import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MobileNav } from '@/components/layout/mobile-nav'
import { I18nProvider } from '@/i18n'
import { HomePage } from '@/pages/home-page'
import { ExplorePage } from '@/pages/explore-page'
import { OfferDetailPage } from '@/pages/offer-detail-page'
import { MerchantsPage, MerchantDetailPage } from '@/pages/merchants-page'
import { NearbyPage } from '@/pages/nearby-page'
import { SavedPage } from '@/pages/saved-page'

export function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <div className="flex min-h-svh flex-col">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/offers/:id" element={<OfferDetailPage />} />
              <Route path="/merchants" element={<MerchantsPage />} />
              <Route path="/merchants/:merchant" element={<MerchantDetailPage />} />
              <Route path="/nearby" element={<NearbyPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
          <MobileNav />
        </div>
      </BrowserRouter>
    </I18nProvider>
  )
}

export default App
