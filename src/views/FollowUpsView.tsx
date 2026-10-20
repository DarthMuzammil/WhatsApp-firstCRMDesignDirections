import { useState } from 'react'
import { DEMO_METRICS, type Lead, type Task } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { dayLabel, todayLabel, weekdayIndexMondayFirst } from '../lib/format'
import { ReminderDialog } from '../modals/ReminderDialog'
import type { Notify } from '../components/Toast'
import type { DemoStore } from '../state/useDemoStore'
import './FollowUpsView.css'

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Today's follow-up checklist, reminders set for later days, and a weekly consistency chart. */
export function FollowUpsView({ store, onOpenLead, onCall, notify }: { store: DemoStore; onOpenLead: (lead: Lead) => void; onCall: (lead: Lead) => void; notify: Notify }) {
  const [adding, setAdding] = useState(false)
  const total = store.tasks.length
  const done = total - store.remainingTasks.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const todayIndex = weekdayIndexMondayFirst()

  return (
    <section className="followups-view">
      <header className="page-head">
        <div><span className="eyebrow">{todayLabel()}</span><h1>Follow-ups</h1><p>A focused list of promises to keep today.</p></div>
        <div className="completion-ring" style={{ background: `conic-gradient(var(--success) 0 ${percent}%, var(--border) ${percent}% 100%)` }} role="img" aria-label={`${done} of ${total} follow-ups completed`}>
          <strong>{done}/{total}</strong><span>done</span>
        </div>
      </header>

      <div className="followup-layout">
        <section className="card">
          <header className="card-head">
            <div><h2>Today</h2><p>{store.remainingTasks.length} remaining</p></div>
            <button className="btn btn-soft" onClick={() => setAdding(true)}><Icon name="plus" /> Add reminder</button>
          </header>
          {store.tasks.map(renderTask)}
          {store.remainingTasks.length === 0 && (
            <div className="empty-state"><span className="icon-badge"><Icon name="check" /></span><h3>That’s everything for today</h3><p>Every buyer has heard from you. Enjoy the breathing room.</p></div>
          )}
          {store.upcomingTasks.length > 0 && <>
            <header className="card-head followup-upcoming-head"><div><h2>Coming up</h2><p>{store.upcomingTasks.length} later this week</p></div></header>
            {store.upcomingTasks.map(renderTask)}
          </>}
        </section>

        <aside className="followup-aside">
          <span className="eyebrow">This week</span>
          <h2>Consistency wins deals</h2>
          <div className="week-chart" aria-hidden="true">
            {WEEKDAY_INITIALS.map((day, index) => (
              <div key={index}><i style={{ height: `${DEMO_METRICS.weeklyFollowUps[index]}%` }} className={index === todayIndex ? 'today' : ''} /><span>{day}</span></div>
            ))}
          </div>
          <strong>{DEMO_METRICS.followUpRate}%</strong>
          <p>of leads followed up within 24 hours</p>
          <div className="followup-note"><Icon name="spark" /><span><strong>Strong momentum</strong><small>You’re {DEMO_METRICS.followUpRateChange}% ahead of last week.</small></span></div>
        </aside>
      </div>
      {adding && <ReminderDialog store={store} onClose={() => setAdding(false)} onSaved={(message) => { setAdding(false); notify(message) }} />}
    </section>
  )

  function renderTask(task: Task) {
    const lead = store.findLead(task.leadId)
    if (!lead) return null
    const isDone = store.completedTaskIds.includes(task.id)
    const later = (task.day ?? 0) > 0
    return (
      <article key={task.id} className={`task ${isDone ? 'task-done' : ''}`}>
        <button className="task-check" onClick={() => store.toggleTask(task.id)} aria-pressed={isDone} aria-label={isDone ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}>
          <span>{isDone && <Icon name="check" size={15} />}</span>
        </button>
        <time>{later && <small>{dayLabel(task.day ?? 0)}</small>}{task.time}</time>
        <LeadAvatar lead={lead} size="sm" />
        <button className="task-copy" onClick={() => onOpenLead(lead)}><strong>{task.title}</strong><span>{lead.name} · {task.note}</span></button>
        <button className="task-action" onClick={() => (task.channel === 'Call' ? onCall(lead) : onOpenLead(lead))} aria-label={`${task.channel} ${lead.name}`}>
          <Icon name={task.channel === 'Call' ? 'phone' : 'whatsapp'} /><span>{task.channel}</span>
        </button>
      </article>
    )
  }
}
