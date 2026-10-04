'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { Offer } from '@/types'
import { getValidGeoLocations, getMerchantName, formatDiscount, haversineDistance, formatDistance } from '@/lib/offers'
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

export function OfferMap({ offers, userLocation, className, selectedOfferId, onSelectOffer }: OfferMapProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [6.9271, 79.8612],
      zoom: 11,
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
  }, [])

  // Update markers when offers change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds: L.LatLngExpression[] = []

    for (const offer of offers) {
      const locations = getValidGeoLocations(offer)
      for (const loc of locations) {
        const marker = L.marker([loc.lat, loc.lng])
        const merchant = getMerchantName(offer)
        const discount = formatDiscount(offer.discount_percentage)
        let distanceStr = ''
        if (userLocation) {
          const dist = haversineDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
          distanceStr = formatDistance(dist)
        }

        const popupHtml = `
          <div style="min-width: 180px; padding: 4px;">
            <p style="font-weight: 600; margin: 0 0 4px; font-size: 13px;">${escapeHtml(merchant)}</p>
            ${discount ? `<p style="margin: 0 0 2px; font-size: 13px; color: #555;">${discount} ${t('offer.discountOff')}</p>` : ''}
            <p style="margin: 0 0 4px; font-size: 12px; color: #888;">${escapeHtml(offer.bank || '')}</p>
            ${distanceStr ? `<p style="margin: 0 0 6px; font-size: 12px; color: #666;">${t('nearby.distance', { distance: distanceStr })}</p>` : ''}
            <a href="/offers/${offer.id}" style="display: inline-block; padding: 4px 10px; background: #333; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">${t('offer.viewOffer')}</a>
          </div>
        `
        marker.bindPopup(popupHtml)
        marker.on('click', () => onSelectOffer?.(offer.id))
        marker.addTo(map)
        markersRef.current.push(marker)
        bounds.push([loc.lat, loc.lng])
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] })
    }
  }, [offers, userLocation, t, onSelectOffer])

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    if (userLocation) {
      const icon = L.divIcon({
        html: '<div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>',
        className: 'user-location-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon })
      marker.addTo(map)
      userMarkerRef.current = marker
    }
  }, [userLocation])

  // Fly to selected offer
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedOfferId) return

    const offer = offers.find((o) => o.id === selectedOfferId)
    if (!offer) return
    const locs = getValidGeoLocations(offer)
    if (locs.length > 0) {
      map.panTo([locs[0].lat, locs[0].lng], { animate: true })
    }
  }, [selectedOfferId, offers])

  return <div ref={containerRef} className={className} />
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
