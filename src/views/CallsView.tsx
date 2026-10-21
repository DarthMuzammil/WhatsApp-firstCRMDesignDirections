import { useState } from 'react'
import { DEMO_METRICS, type Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { formatDuration } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './CallsView.css'

/** Fake waveform bar heights (px), fixed so the bars don't jump between renders. */
const WAVEFORM = Array.from({ length: 42 }, (_, i) => 6 + ((i * 7) % 14))

/** Call history and recordings. "New call" opens the call picker (owned by App). */
export function CallsView({ store, onOpenLead, onNewCall }: { store: DemoStore; onOpenLead: (lead: Lead) => void; onNewCall: () => void }) {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const rows = store.recordings
    .map((recording) => ({ recording, lead: store.findLead(recording.leadId) }))
    .filter((row): row is { recording: typeof row.recording; lead: Lead } => !!row.lead && row.lead.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <section className="calls-view">
      <header className="page-head">
        <div><span className="eyebrow">Voice workspace</span><h1>Calls & recordings</h1><p>Every important conversation, connected to the right buyer.</p></div>
        <button className="btn btn-primary" onClick={onNewCall}><Icon name="phone" /> New call</button>
      </header>

      <div className="stat-strip">
        <div><span>Calls this week</span><strong>{DEMO_METRICS.callsThisWeek}</strong><small>{DEMO_METRICS.callTimeThisWeek} total</small></div>
        <div><span>Answer rate</span><strong>{DEMO_METRICS.answerRate}%</strong><small className="positive">+{DEMO_METRICS.answerRateChange}% vs last week</small></div>
        <div><span>Recorded</span><strong>{store.recordings.length}</strong><small>Private to your workspace</small></div>
      </div>

      <section className="card">
        <header className="card-head recordings-head">
          <div><h2>Recent recordings</h2><p>{store.recordings.length} saved calls</p></div>
          <label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buyer" aria-label="Search recordings by buyer" /></label>
        </header>
        {rows.map(({ recording, lead }) => {
          const playing = playingId === recording.id
          return (
            <article key={recording.id} className={`recording ${playing ? 'playing' : ''}`}>
              <button className="recording-play" onClick={() => setPlayingId(playing ? null : recording.id)} aria-label={playing ? 'Pause recording' : `Play call with ${lead.name}`}>
                <Icon name={playing ? 'pause' : 'play'} />
              </button>
              <button className="recording-person" onClick={() => onOpenLead(lead)}>
                <LeadAvatar lead={lead} size="sm" />
                <span><strong>{lead.name}</strong><small>{recording.when}</small></span>
              </button>
              <div className="waveform" aria-hidden="true">
                {WAVEFORM.map((height, i) => <i key={i} style={{ height }} />)}
                <span className={playing ? 'moving' : ''} />
              </div>
              <time>{formatDuration(recording.duration)}</time>
              <p>{recording.note}</p>
            </article>
          )
        })}
        {rows.length === 0 && (query.trim()
          ? <div className="empty-state"><span className="icon-badge"><Icon name="mic" /></span><h3>No recordings found</h3><p>Try another buyer name or start a new call.</p></div>
          : <div className="empty-state"><span className="icon-badge"><Icon name="mic" /></span><h3>No recorded calls yet</h3><p>Calls you make from Bayana are recorded and saved here, on the buyer’s timeline too.</p><button className="btn btn-secondary" onClick={onNewCall}><Icon name="phone" size={16} /> New call</button></div>)}
      </section>
      <p className="recording-consent"><Icon name="mic" size={14} /> Always ask for consent before recording a call. Recording rules can vary by context and location.</p>
    </section>
  )
}
