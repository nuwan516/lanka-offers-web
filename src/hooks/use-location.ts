import * as React from 'react'

export type GeoPermissionState =
  | 'not_requested'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unsupported'

export interface UserLocation {
  lat: number
  lng: number
}

interface UseLocationState {
  permission: GeoPermissionState
  location: UserLocation | null
  error: string | null
  requestLocation: () => void
}

export function useLocation(): UseLocationState {
  const [permission, setPermission] = React.useState<GeoPermissionState>('not_requested')
  const [location, setLocation] = React.useState<UserLocation | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const requestLocation = React.useCallback(() => {
    if (!('geolocation' in navigator)) {
      setPermission('unsupported')
      setError('unsupported')
      return
    }

    setPermission('requesting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setPermission('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermission('denied')
          setError('denied')
        } else {
          setPermission('unavailable')
          setError('unavailable')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { permission, location, error, requestLocation }
}
