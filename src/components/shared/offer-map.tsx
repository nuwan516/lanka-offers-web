'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { Offer } from '@/types'
import {
  getConfirmedBranches,
  getMerchantName,
  getDiscountPresentation,
  haversineDistance,
  formatDistance,
  cleanLocationText,
} from '@/lib/offers'
import { useI18n } from '@/i18n'
import { env } from '@/config/env'

interface OfferMapProps {
  offers: Offer[]
  userLocation?: { lat: number; lng: number } | null
  className?: string
  selectedOfferId?: string | null
  onSelectOffer?: (id: string) => void
}

const TILE_URL = env.mapTileUrl
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: 'offer-pin-wrap',
    html: `<span class="offer-pin${selected ? ' is-selected' : ''}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

export function OfferMap({ offers, userLocation, className, selectedOfferId, onSelectOffer }: OfferMapProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ id: string; marker: L.Marker }[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const onSelectRef = useRef(onSelectOffer)
  onSelectRef.current = onSelectOffer

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: userLocation ? [userLocation.lat, userLocation.lng] : [6.9271, 79.8612],
      zoom: 12,
      scrollWheelZoom: true,
    })

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // The map is created once; later location changes move the user marker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.marker.remove())
    markersRef.current = []

    const bounds: L.LatLngExpression[] = []
    if (userLocation) bounds.push([userLocation.lat, userLocation.lng])

    for (const offer of offers) {
      const locations = getConfirmedBranches(offer)
      for (const loc of locations) {
        const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon(false) })
        const merchant = getMerchantName(offer)
        const discount = getDiscountPresentation(offer)
        const discountText = discount
          ? t(discount.isUpTo ? 'offer.discountUpTo' : 'offer.discountFixed', { value: discount.value })
          : ''
        let distanceStr = ''
        if (userLocation) {
          distanceStr = formatDistance(haversineDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng))
        }

        const addressStr = loc.address || loc.name || offer.merchant_location || ''
        const popupHtml = `
          <div class="offer-popup">
            <p class="offer-popup-title">${escapeHtml(merchant)}</p>
            ${discountText ? `<p class="offer-popup-discount">${escapeHtml(discountText)}</p>` : ''}
            <p class="offer-popup-meta">${escapeHtml(offer.title)}</p>
            ${addressStr ? `<p class="offer-popup-meta">${escapeHtml(cleanLocationText(addressStr))}</p>` : ''}
            ${distanceStr ? `<p class="offer-popup-meta">${escapeHtml(t('nearby.distance', { distance: distanceStr }))}</p>` : ''}
            <a class="offer-popup-link" href="/offers/${offer.id}">${escapeHtml(t('offer.viewOffer'))}</a>
          </div>
        `
        marker.bindPopup(popupHtml)
        marker.on('click', () => onSelectRef.current?.(offer.id))
        marker.addTo(map)
        markersRef.current.push({ id: offer.id, marker })
        bounds.push([loc.lat, loc.lng])
      }
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] })
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, 14)
    }
  }, [offers, userLocation, t])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    if (userLocation) {
      const icon = L.divIcon({
        html: '<span class="user-pin"></span>',
        className: 'user-pin-wrap',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, interactive: false })
      marker.addTo(map)
      userMarkerRef.current = marker
    }
  }, [userLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedOfferId) return

    for (const entry of markersRef.current) {
      const selected = entry.id === selectedOfferId
      entry.marker.setIcon(pinIcon(selected))
    }

    const offer = offers.find((o) => o.id === selectedOfferId)
    if (!offer) return
    const locs = getConfirmedBranches(offer)
    if (locs.length > 0) {
      map.panTo([locs[0].lat, locs[0].lng], { animate: true })
      markersRef.current.find((m) => m.id === selectedOfferId)?.marker.openPopup()
    }
  }, [selectedOfferId, offers])

  return (
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label={t('nearby.mapLabel')}
    />
  )
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
