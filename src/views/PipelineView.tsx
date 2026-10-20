import { useState, type DragEvent } from 'react'
import { COMMISSION_RATE, STAGES, type Lead } from '../data/demo'
import { shortName } from '../data/team'
import { LeadAvatar } from '../components/Avatar'
import { HeatBadge } from '../components/HeatBadge'
import { Icon } from '../components/Icon'
import { latestOffer, staleOfferDays } from '../data/deals'
import { dayLabel, formatCrore, formatLakhFromCrore } from '../lib/format'
import { DealDialog, LostDialog } from '../modals/DealDialog'
import type { DemoStore } from '../state/useDemoStore'
import './PipelineView.css'

const CLOSED = STAGES.length // index of the extra "Closed" column

/**
 * Deal pipeline (spec §8.10).
 * - Desktop: five columns (four open stages + Closed); cards can be dragged between open stages.
 * - Tablet: the same columns in a two-column grid.
 * - Phone: stage tabs, one stage's cards at a time; opens on the first stage that has deals.
 * Every move also has a button (forward, back, won, lost), so nothing depends on dragging.
 */
export function PipelineView({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: (message: string) => void }) {
  const [hotOnly, setHotOnly] = useState(false)
  const visibleLeads = store.leads.filter((lead) => !hotOnly || lead.temp === 'Hot')
  const leadsInColumn = (column: number) => visibleLeads.filter((lead) => (column === CLOSED ? !!lead.closed : !lead.closed && lead.stage === column))
  const [phoneStage, setPhoneStage] = useState(() => Math.max(0, [0, 1, 2, 3].findIndex((column) => leadsInColumn(column).length > 0)))
  const [winning, setWinning] = useState<Lead | null>(null)
  const [losing, setLosing] = useState<Lead | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const seesOthers = store.viewerCan('seeTeamLeads')
  const columns = [...STAGES, 'Closed']

  function moveForward(lead: Lead) {
    store.moveToNextStage(lead.id)
    notify(`${lead.name} moved to ${STAGES[Math.min(STAGES.length - 1, lead.stage + 1)]}`)
  }
  function moveBack(lead: Lead) {
    store.moveToPreviousStage(lead.id)
    notify(`${lead.name} moved back to ${STAGES[lead.stage - 1]}`)
  }
  function drop(event: DragEvent, column: number) {
    event.preventDefault()
    setDragOver(null)
    const lead = store.findLead(Number(event.dataTransfer.getData('text/plain')))
    if (!lead || lead.closed || column === CLOSED || lead.stage === column) return
    store.setStage(lead.id, column)
    notify(`${lead.name} moved to ${STAGES[column]}`)
  }

  return (
    <section className="pipeline-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">{formatCrore(store.activeValueCr)} active value</span>
          <h1>Your deal pipeline</h1>
          <p>Move every buyer towards the right home, one clear step at a time. On desktop you can drag cards between stages.</p>
        </div>
        <button className={`btn btn-secondary ${hotOnly ? 'active' : ''}`} aria-pressed={hotOnly} onClick={() => setHotOnly(!hotOnly)}>
          <Icon name="filter" /> {hotOnly ? 'Showing hot leads' : 'Hot leads only'}
        </button>
      </header>

      <div className="stat-strip">
        <div><span>Open deals</span><strong>{store.openLeads.length}</strong><small>{store.leads.filter((lead) => lead.closed?.result === 'won').length} won · {store.leads.filter((lead) => lead.closed?.result === 'lost').length} lost</small></div>
        <div><span>Visits planned</span><strong>{store.openLeads.filter((lead) => lead.stage === 2).length}</strong><small>Leads in Visit planned</small></div>
        <div><span>Likely commission</span><strong>{formatLakhFromCrore(store.weightedCommissionCr)}</strong><small>Weighted by stage · {COMMISSION_RATE * 100}% fee</small></div>
      </div>

      <div className="chip-row stage-tabs" role="tablist" aria-label="Pipeline stages">
        {columns.map((stage, index) => (
          <button key={stage} role="tab" aria-selected={phoneStage === index} className={`chip chip-dark ${phoneStage === index ? 'active' : ''}`} onClick={() => setPhoneStage(index)}>
            <i className={`stage-dot stage-${index}`} />{stage}<b className={`count-badge ${phoneStage === index ? 'mint' : 'neutral'}`}>{leadsInColumn(index).length}</b>
          </button>
        ))}
      </div>

      <div className="pipeline-board">
        {columns.map((stage, index) => {
          const columnLeads = leadsInColumn(index)
          return (
            <section
              key={stage}
              className={`pipeline-stage ${phoneStage === index ? 'phone-visible' : ''} ${dragOver === index ? 'drag-over' : ''} ${index === CLOSED ? 'is-closed' : ''}`}
              aria-label={stage}
              onDragOver={(event) => { if (index !== CLOSED) { event.preventDefault(); setDragOver(index) } }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => drop(event, index)}
            >
              <header><div><i className={`stage-dot stage-${index}`} /><strong>{stage}</strong></div><b className="count-badge neutral">{columnLeads.length}</b></header>
              <div className="pipeline-cards">
                {columnLeads.map((lead) => {
                  const deal = store.dealFor(lead.id)
                  const offer = latestOffer(deal, 'buyer')
                  const staleDays = staleOfferDays(deal)
                  return (
                    <article
                      key={lead.id}
                      className={`deal-card ${lead.closed ? `closed-${lead.closed.result}` : ''}`}
                      draggable={!lead.closed}
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', String(lead.id))}
                    >
                      <button className="deal-person" onClick={() => onOpenLead(lead)}>
                        <LeadAvatar lead={lead} size="sm" />
                        <span><strong>{lead.name}</strong><small>{lead.need}{seesOthers ? ` · ${lead.ownerId ? shortName(store.findMember(lead.ownerId)?.name ?? '') : 'Unassigned'}` : ''}</small></span>
                        <Icon name="chevron" size={16} />
                      </button>
                      {lead.closed ? (
                        <p className={`deal-outcome ${lead.closed.result}`}>
                          <Icon name={lead.closed.result === 'won' ? 'check' : 'close'} size={14} />
                          {lead.closed.result === 'won' ? `Won${deal?.agreedCr ? ` at ₹${deal.agreedCr} Cr` : ''}` : `Lost · ${lead.closed.reason}`}
                        </p>
                      ) : <>
                        <div className="deal-budget"><span>{offer ? `Offer · ${dayLabel(offer.day)}` : 'Budget'}</span><strong>{offer ? `₹${offer.amountCr} Cr` : lead.budget}</strong></div>
                        {staleDays !== null && <span className="lead-flag warning deal-stale-flag">No new offer in {staleDays} days</span>}
                        <p className="deal-message"><Icon name="whatsapp" size={14} />{lead.message}</p>
                      </>}
                      <footer>
                        <HeatBadge temp={lead.temp} />
                        <span className="deal-buttons">
                          {lead.closed
                            ? <button className="deal-advance" onClick={() => { store.reopenLead(lead.id); notify(`${lead.name} reopened`) }}>Reopen</button>
                            : <>
                                {lead.stage > 0 && <button className="deal-back" aria-label={`Move ${lead.name} back to ${STAGES[lead.stage - 1]}`} onClick={() => moveBack(lead)}><Icon name="back" size={14} /></button>}
                                {lead.stage < STAGES.length - 1
                                  ? <button className="deal-advance" onClick={() => moveForward(lead)}>Move to {STAGES[lead.stage + 1]} <Icon name="arrow" size={14} /></button>
                                  : <>
                                      <button className="deal-lost" onClick={() => setLosing(lead)}>Lost</button>
                                      <button className="deal-won" onClick={() => setWinning(lead)}><Icon name="check" size={14} /> Won</button>
                                    </>}
                              </>}
                        </span>
                      </footer>
                    </article>
                  )
                })}
                {columnLeads.length === 0 && <div className="pipeline-empty"><Icon name="check" /><span>{index === CLOSED ? 'No closed deals yet' : 'No deals in this stage'}</span></div>}
              </div>
            </section>
          )
        })}
      </div>

      {winning && <DealDialog lead={winning} store={store} mode="win" onClose={() => setWinning(null)} onSaved={(message) => { setWinning(null); notify(message) }} />}
      {losing && <LostDialog lead={losing} onClose={() => setLosing(null)} onConfirm={(reason) => { store.closeLead(losing.id, { result: 'lost', reason }); notify(`${losing.name} marked lost`); setLosing(null) }} />}
    </section>
  )
}
