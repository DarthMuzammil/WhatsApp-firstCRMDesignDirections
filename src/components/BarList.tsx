import './BarList.css'

export type BarRow = {
  key: string
  label: string
  /** Shown under the label (e.g. team). */
  sublabel?: string
  value: number
  /** Formatted value shown at the bar tip and in the tooltip. */
  display: string
  /** Emphasis: highlight this row and mute the rest (e.g. "you" on a leaderboard). */
  highlight?: boolean
}

/**
 * Horizontal bar chart for one series (one colour, no legend; see the dataviz rules in AGENTS.md).
 * Value at the tip, tooltip on hover and keyboard focus, optional click-through per row.
 */
export function BarList({ rows, label, onSelect, rank = false }: { rows: BarRow[]; label: string; onSelect?: (key: string) => void; rank?: boolean }) {
  const max = Math.max(...rows.map((row) => row.value), 0) || 1
  const emphasis = rows.some((row) => row.highlight)
  return (
    <ol className={`bar-list ${emphasis ? 'has-emphasis' : ''} ${rank ? 'ranked' : ''}`} aria-label={label}>
      {rows.map((row, index) => {
        const content = <>
          {rank && <span className="bar-rank">{index + 1}</span>}
          <span className="bar-label"><span>{row.label}</span>{row.sublabel && <small>{row.sublabel}</small>}</span>
          <span className="bar-track">
            <i style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
            <b>{row.display}</b>
            <span className="bar-tooltip" role="tooltip"><strong>{row.display}</strong> {row.label}</span>
          </span>
        </>
        return (
          <li key={row.key} className={row.highlight ? 'is-highlight' : ''}>
            {onSelect
              ? <button className="bar-row" onClick={() => onSelect(row.key)} aria-label={`${row.label}: ${row.display}`}>{content}</button>
              : <div className="bar-row" tabIndex={0} aria-label={`${row.label}: ${row.display}`}>{content}</div>}
          </li>
        )
      })}
    </ol>
  )
}
