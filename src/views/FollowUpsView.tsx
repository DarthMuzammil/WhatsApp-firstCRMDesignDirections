import { DEMO_METRICS, type Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { todayLabel, weekdayIndexMondayFirst } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './FollowUpsView.css'

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Today's follow-up checklist with a weekly consistency chart. */
export function FollowUpsView({ store, onOpenLead, onCall }: { store: DemoStore; onOpenLead: (lead: Lead) => void; onCall: (lead: Lead) => void }) {
  const total = store.tasks.length
  const done = total - store.remainingTasks.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const todayIndex = weekdayIndexMondayFirst()

  return (
    <section className="followups-view">
      <header className="page-head">
        <div><span className="eyebrow">{todayLabel()}</span><h1>Follow-ups</h1><p>A focused list of promises to keep today.</p></div>
        <div className="completion-ring" style={{ background: `conic-gradient(#58bc86 0 ${percent}%, #e2e5ea ${percent}% 100%)` }} role="img" aria-label={`${done} of ${total} follow-ups completed`}>
          <strong>{done}/{total}</strong><span>done</span>
        </div>
      </header>

      <div className="followup-layout">
        <section className="card">
          <header className="card-head">
            <div><h2>Today</h2><p>{store.remainingTasks.length} remaining</p></div>
            <button className="btn btn-soft" disabled={store.extraReminderAdded} onClick={store.addExtraReminder}>
              <Icon name={store.extraReminderAdded ? 'check' : 'plus'} /> {store.extraReminderAdded ? 'Reminder added' : 'Add reminder'}
            </button>
          </header>
          {store.tasks.map((task) => {
            const lead = store.findLead(task.leadId)
            if (!lead) return null
            const isDone = store.completedTaskIds.includes(task.id)
            return (
              <article key={task.id} className={`task ${isDone ? 'task-done' : ''}`}>
                <button className="task-check" onClick={() => store.toggleTask(task.id)} aria-pressed={isDone} aria-label={isDone ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`}>
                  <span>{isDone && <Icon name="check" size={15} />}</span>
                </button>
                <time>{task.time}</time>
                <LeadAvatar lead={lead} size="sm" />
                <button className="task-copy" onClick={() => onOpenLead(lead)}><strong>{task.title}</strong><span>{lead.name} · {task.note}</span></button>
                <button className="task-action" onClick={() => (task.channel === 'Call' ? onCall(lead) : onOpenLead(lead))} aria-label={`${task.channel} ${lead.name}`}>
                  <Icon name={task.channel === 'Call' ? 'phone' : 'whatsapp'} /><span>{task.channel}</span>
                </button>
              </article>
            )
          })}
          {store.remainingTasks.length === 0 && (
            <div className="empty-state"><span><Icon name="check" /></span><h3>That’s everything for today</h3><p>Every buyer has heard from you. Enjoy the breathing room.</p></div>
          )}
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
    </section>
  )
}
