// Location readings for check-ins (spec §8.0). A web app can only read location at the moment
// someone taps, with their permission. There is no background tracking.

export type LatLng = { lat: number; lng: number }
export type Reading = LatLng & { accuracyM: number; source: 'demo' | 'device' }
/** Demo control: pretend the phone is at the office, near the client, or far away, or use this device's real location. */
export type PretendLocation = 'office' | 'client' | 'far' | 'device'

/** Great-circle distance in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Move a point roughly `metres` north-east. */
function offset(point: LatLng, metres: number): LatLng {
  const dLat = metres / 111320 / Math.SQRT2
  const dLng = metres / (111320 * Math.cos((point.lat * Math.PI) / 180)) / Math.SQRT2
  return { lat: point.lat + dLat, lng: point.lng + dLng }
}

/** Scripted reading for the demo. `office` is where "At office" puts you; `target` is the client/property. */
export function pretendReading(mode: Exclude<PretendLocation, 'device'>, target: LatLng, office: LatLng): Reading {
  if (mode === 'office') return { ...offset(office, 25), accuracyM: 15, source: 'demo' }
  if (mode === 'client') return { ...offset(target, 60), accuracyM: 12, source: 'demo' }
  return { ...offset(target, 1400), accuracyM: 20, source: 'demo' }
}

/** One real reading from this device's browser. Rejects if permission is denied, unavailable or too slow. */
export function deviceReading(): Promise<Reading> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('This browser can’t share location.')); return }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracyM: Math.round(position.coords.accuracy), source: 'device' }),
      (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? 'Location permission was denied. Allow it in the browser to check in.' : 'Couldn’t get a location fix. Try again near a window or outdoors.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}
