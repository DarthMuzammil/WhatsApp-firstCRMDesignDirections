import type { PretendLocation } from '../lib/location'
import { Icon } from './Icon'
import './LocationControl.css'

const LABELS: Record<PretendLocation, string> = { office: 'At office', client: 'Near client', far: 'Far away', device: 'This device' }

/**
 * Demo control: where the phone pretends to be when someone taps a location button
 * (or "This device" for the browser's real location). States the web-app limits (spec §8.0).
 */
export function LocationControl({ value, onChange, options, radiusM }: { value: PretendLocation; onChange: (value: PretendLocation) => void; options: PretendLocation[]; radiusM: number }) {
  return (
    <section className="card location-panel">
      <div>
        <strong><Icon name="pin" size={16} /> Where is this phone? <em>Demo</em></strong>
        <small>Location is read once, only when you tap. No live tracking. Check-ins are refused beyond {radiusM} m.</small>
      </div>
      <div className="segmented" role="radiogroup" aria-label="Demo location">
        {options.map((option) => (
          <button key={option} role="radio" aria-checked={value === option} className={value === option ? 'active' : ''} onClick={() => onChange(option)}>{LABELS[option]}</button>
        ))}
      </div>
    </section>
  )
}
