import { useState, type FormEvent } from 'react'
import { MOVE_IN_OPTIONS, PROPERTY_TYPES, formatBudget, parseBudget, type Lead, type Purpose } from '../data/demo'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { LeadProfileEdit } from '../state/useDemoStore'
import './EditLeadDialog.css'

/** Structured buyer brief (spec §8.5). Saving rebuilds the display fields (need, budget) from the structured values. */
export function EditLeadDialog({ lead, onSave, onClose }: { lead: Lead; onSave: (edit: LeadProfileEdit) => void; onClose: () => void }) {
  const budget = parseBudget(lead.budget)
  const [kind, setKind] = useState<string>(PROPERTY_TYPES.find((type) => lead.need.includes(type)) ?? (lead.need.includes('Villa') ? 'Villa' : PROPERTY_TYPES[1]))
  const [purpose, setPurpose] = useState<Purpose>(lead.purpose ?? (lead.moveIn === 'Investment' ? 'Investment' : 'Live-in'))
  const [min, setMin] = useState(budget ? String(budget.min) : '')
  const [max, setMax] = useState(budget ? String(budget.max) : '')
  const [localities, setLocalities] = useState((lead.localities ?? [lead.locality]).join(', '))
  const [moveIn, setMoveIn] = useState(lead.moveIn)
  const [mustHave, setMustHave] = useState(lead.mustHave === 'To confirm' ? '' : lead.mustHave)

  const minValue = Number(min)
  const maxValue = Number(max)
  const budgetEntered = min !== '' && max !== ''
  const budgetError = budgetEntered && (!(minValue > 0) || !(maxValue > 0) || maxValue < minValue) ? 'Maximum must be the same as or above the minimum.' : ''

  function submit(event: FormEvent) {
    event.preventDefault()
    if (budgetError) return
    const places = localities.split(',').map((place) => place.trim()).filter(Boolean)
    const firstPlace = places[0] ?? lead.locality
    onSave({
      need: purpose === 'Investment' && kind !== 'Villa' && kind !== 'Plot' ? `Investment ${kind}, ${firstPlace}` : `${kind} in ${firstPlace}`,
      budget: budgetEntered ? formatBudget(minValue, maxValue) : 'Budget to qualify',
      budgetCr: budgetEntered ? (minValue + maxValue) / 2 : 0,
      locality: firstPlace,
      localities: places.length > 0 ? places : [lead.locality],
      moveIn,
      mustHave: mustHave.trim() || 'To confirm',
      purpose,
    })
  }

  return (
    <Dialog label={`Edit ${lead.name}`} onClose={onClose} className="add-lead edit-lead">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Buyer brief</span>
      <h2>{lead.name}</h2>
      <p className="add-lead-intro">Keep this current; matching, totals and the team all use it.</p>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Looking for
            <select value={kind} onChange={(event) => setKind(event.target.value)}>{PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          </label>
          <fieldset className="purpose-field">
            <legend>Purpose</legend>
            <div className="segmented">
              {(['Live-in', 'Investment'] as Purpose[]).map((option) => (
                <button type="button" key={option} className={purpose === option ? 'active' : ''} aria-pressed={purpose === option} onClick={() => setPurpose(option)}>{option}</button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="form-row">
          <label>Budget from (₹ Cr)<input inputMode="decimal" value={min} onChange={(event) => setMin(event.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 2.4" /></label>
          <label>Budget up to (₹ Cr)<input inputMode="decimal" value={max} onChange={(event) => setMax(event.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 2.8" /></label>
        </div>
        {budgetError && <p className="form-error" role="alert">{budgetError}</p>}
        <label>Localities (comma separated)<input value={localities} onChange={(event) => setLocalities(event.target.value)} placeholder="e.g. Indiranagar, Domlur" /></label>
        <div className="form-row">
          <label>Move-in
            <select value={moveIn} onChange={(event) => setMoveIn(event.target.value)}>
              {[...new Set([moveIn, ...MOVE_IN_OPTIONS])].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>Must-haves<input value={mustHave} onChange={(event) => setMustHave(event.target.value)} placeholder="e.g. Balcony · Covered parking" /></label>
        </div>
        <button className="btn btn-primary btn-block add-lead-submit" disabled={!!budgetError}>Save brief <Icon name="check" /></button>
      </form>
    </Dialog>
  )
}
