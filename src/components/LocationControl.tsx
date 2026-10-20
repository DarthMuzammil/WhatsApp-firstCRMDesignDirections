import type { PretendLocation } from '../lib/location'
import { Icon } from './Icon'
import './LocationControl.css'

const LABELS: Record<PretendLocation, string> = { office: 'At office', client: 'Near client', far: 'Far away', device: 'This device' }

/**
 * Demo control, kept to one slim strip: where the phone pretends to be when someone taps a location button
 * (or "This device" for the browser's real location), plus the web-app limits in one line (spec §8.0).
 */
export function LocationControl({ value, onChange, options, radiusM }: { value: PretendLocation; onChange: (value: PretendLocation) => void; options: PretendLocation[]; radiusM: number }) {
  return (
    <section className="location-panel" aria-label="Demo: where this phone is">
      <span className="location-head"><Icon name="pin" size={14} /><strong>Phone location</strong><em>Demo</em></span>
      <div className="segmented" role="radiogroup" aria-label="Demo location">
        {options.map((option) => (
          <button key={option} role="radio" aria-checked={value === option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{LABELS[option]}</button>
        ))}
      </div>
      <small>Read once when you tap · no live tracking · refused beyond {radiusM} m</small>
    </section>
  )
}
