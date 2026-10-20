import { useId, type KeyboardEvent, type MouseEvent } from 'react'
import { Icon } from './Icon'
import type { LatLng } from '../lib/location'
import './PinMap.css'

/** Metres shown across the map's width. The map is twice as wide as it is tall. */
const SPAN_M = 1600
const NUDGE_M = 20

function toPoint(centre: LatLng, dxM: number, dyM: number): LatLng {
  return { lat: centre.lat + dyM / 111320, lng: centre.lng + dxM / (111320 * Math.cos((centre.lat * Math.PI) / 180)) }
}
function toOffset(centre: LatLng, point: LatLng): { dxM: number; dyM: number } {
  return { dxM: (point.lng - centre.lng) * 111320 * Math.cos((centre.lat * Math.PI) / 180), dyM: (point.lat - centre.lat) * 111320 }
}

/**
 * Demo map for placing a property's location pin (spec §8.18) 🎭: a plain grid around the locality's centre, no map
 * tiles (the product would use a real map service). Tap where the building is; the ring shows the check-in radius.
 * Keyboard: Enter or Space drops the pin in the middle, arrow keys nudge it 20 m.
 */
export function PinMap({ centre, localityName, pin, radiusM, onPlace }: { centre: LatLng; localityName: string; pin?: LatLng; radiusM: number; onPlace: (point: LatLng) => void }) {
  const labelId = useId()
  const offset = pin ? toOffset(centre, pin) : null
  const toPercent = (dxM: number, dyM: number) => ({ left: `${50 + (dxM / SPAN_M) * 100}%`, top: `${50 - (dyM / (SPAN_M / 2)) * 100}%` })
  const onMap = offset ? Math.abs(offset.dxM) <= SPAN_M / 2 && Math.abs(offset.dyM) <= SPAN_M / 4 : false

  function place(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const dxM = ((event.clientX - box.left) / box.width - 0.5) * SPAN_M
    const dyM = (0.5 - (event.clientY - box.top) / box.height) * (SPAN_M / 2)
    onPlace(toPoint(centre, dxM, dyM))
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-NUDGE_M, 0], ArrowRight: [NUDGE_M, 0], ArrowUp: [0, NUDGE_M], ArrowDown: [0, -NUDGE_M] }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPlace(pin ?? centre); return }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    const from = offset ?? { dxM: 0, dyM: 0 }
    onPlace(toPoint(centre, from.dxM + move[0], from.dyM + move[1]))
  }

  return (
    <div className="pin-map" role="button" tabIndex={0} aria-labelledby={labelId} onClick={place} onKeyDown={keyboard}>
      <span className="pin-map-tag"><em>Demo map</em> tap where the building is</span>
      <span className="pin-map-centre" aria-hidden="true"><i />{!(offset && Math.hypot(offset.dxM, offset.dyM) < 120) && <b>{localityName} centre</b>}</span>
      <span className="pin-map-scale" aria-hidden="true" style={{ width: `${(200 / SPAN_M) * 100}%` }}>200 m</span>
      {offset && onMap && (
        <>
          <span className="pin-map-radius" aria-hidden="true" style={{ ...toPercent(offset.dxM, offset.dyM), width: `${((radiusM * 2) / SPAN_M) * 100}%` }} />
          <span className="pin-map-pin" aria-hidden="true" style={toPercent(offset.dxM, offset.dyM)}><Icon name="pin" size={28} /></span>
        </>
      )}
      <span id={labelId} className="pin-map-sr">{pin ? `Property pin placed. ${onMap ? '' : 'It is outside this map. '}Tap or use the arrow keys to move it.` : `Demo map of ${localityName}. Tap, or press Enter, to place the property pin.`}</span>
    </div>
  )
}
