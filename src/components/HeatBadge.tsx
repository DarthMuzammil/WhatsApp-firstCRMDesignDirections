import type { Temperature } from '../data/demo'

/** Hot / Warm / New lead temperature pill. Styles: `.heat` in src/index.css. */
export function HeatBadge({ temp }: { temp: Temperature }) {
  return <span className={`heat heat-${temp.toLowerCase()}`}>{temp}</span>
}
