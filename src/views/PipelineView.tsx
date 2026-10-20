import { useState } from 'react'
import { COMMISSION_RATE, STAGES, type Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { formatCrore, formatLakhFromCrore } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './PipelineView.css'

/**
 * Deal pipeline.
 * - Tablet/desktop: four-column board.
 * - Phone: stage tabs on top, one stage's cards at a time (PRD: no drag-and-drop on phones).
 * Cards move forward with a single tap.
 */
export function PipelineView({ store, onOpenLead, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; notify: (message: string) => void }) {
  const [hotOnly, setHotOnly] = useState(false)
  const [phoneStage, setPhoneStage] = useState(0)
  const visibleLeads = store.leads.filter((lead) => !hotOnly || lead.temp === 'Hot')
  const leadsInStage = (stage: number) => visibleLeads.filter((lead) => lead.stage === stage)

  function moveForward(lead: Lead) {
    const nextStage = Math.min(STAGES.length - 1, lead.stage + 1)
    store.moveToNextStage(lead.id)
    notify(`${lead.name} moved to ${STAGES[nextStage]}`)
  }

  return (
    <section className="pipeline-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">{formatCrore(store.activeValueCr)} active value</span>
          <h1>Your deal pipeline</h1>
          <p>Move every buyer towards the right home, one clear step at a time.</p>
        </div>
        <button className={`btn btn-secondary ${hotOnly ? 'active' : ''}`} aria-pressed={hotOnly} onClick={() => setHotOnly(!hotOnly)}>
          <Icon name="filter" /> {hotOnly ? 'Showing hot leads' : 'Hot leads only'}
        </button>
      </header>

      <div className="stat-strip">
        <div><span>Open deals</span><strong>{store.leads.length}</strong><small>Active buyers</small></div>
        <div><span>Visits planned</span><strong>{store.leads.filter((lead) => lead.stage === 2).length}</strong><small>Next 7 days</small></div>
        <div><span>Likely commission</span><strong>{formatLakhFromCrore(store.weightedCommissionCr)}</strong><small>Weighted by stage · {COMMISSION_RATE * 100}% fee</small></div>
      </div>

      <div className="stage-tabs" role="tablist" aria-label="Pipeline stages">
        {STAGES.map((stage, index) => (
          <button key={stage} role="tab" aria-selected={phoneStage === index} className={phoneStage === index ? 'active' : ''} onClick={() => setPhoneStage(index)}>
            <i className={`stage-dot stage-${index}`} />{stage}<b>{leadsInStage(index).length}</b>
          </button>
        ))}
      </div>

      <div className="pipeline-board">
        {STAGES.map((stage, index) => {
          const stageLeads = leadsInStage(index)
          return (
            <section key={stage} className={`pipeline-stage ${phoneStage === index ? 'phone-visible' : ''}`} aria-label={stage}>
              <header><div><i className={`stage-dot stage-${index}`} /><strong>{stage}</strong></div><span>{stageLeads.length}</span></header>
              <div className="pipeline-cards">
                {stageLeads.map((lead) => (
                  <article key={lead.id} className="deal-card">
                    <button className="deal-person" onClick={() => onOpenLead(lead)}>
                      <LeadAvatar lead={lead} size="sm" />
                      <span><strong>{lead.name}</strong><small>{lead.need}</small></span>
                      <Icon name="chevron" size={16} />
                    </button>
                    <div className="deal-budget"><span>Budget</span><strong>{lead.budget}</strong></div>
                    <p className="deal-message"><Icon name="whatsapp" size={14} />{lead.message}</p>
                    <footer>
                      <span className={`heat heat-${lead.temp.toLowerCase()}`}>{lead.temp}</span>
                      {index < STAGES.length - 1 && (
                        <button className="deal-advance" onClick={() => moveForward(lead)}>Move to {STAGES[index + 1]} <Icon name="arrow" size={14} /></button>
                      )}
                    </footer>
                  </article>
                ))}
                {stageLeads.length === 0 && <div className="pipeline-empty"><Icon name="check" /><span>No deals in this stage</span></div>}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}
