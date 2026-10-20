import { useState, type FormEvent } from 'react'
import { REMINDER_PRESETS, firstName, type Lead, type TaskChannel } from '../data/demo'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { clockLabel, dayLabel } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './ReminderDialog.css'

const DAY_CHOICES = [0, 1, 2, 3, 4, 5, 6, 7]
const CHANNELS: TaskChannel[] = ['WhatsApp', 'Call', 'Send details']
/** Every half hour from 9:00 AM to 8:30 PM. */
const TIMES = Array.from({ length: 24 }, (_, index) => {
  const date = new Date(2000, 0, 1, 9, index * 30)
  return { label: clockLabel(date), minutes: date.getHours() * 60 + date.getMinutes() }
})

/** Default: the next half hour at least 30 minutes away today, or tomorrow at 10:00 AM after hours. */
function defaultWhen(now = new Date()): { day: number; time: string } {
  const soon = now.getHours() * 60 + now.getMinutes() + 30
  const slot = TIMES.find((time) => time.minutes >= soon)
  return slot ? { day: 0, time: slot.label } : { day: 1, time: '10:00 AM' }
}

/**
 * "Remind me" (spec §3.5): a follow-up for one buyer, today or later this week. Opened from a chat (the lead is
 * fixed) or from Follow-ups → Add reminder (pick the buyer first). Saved follow-ups appear in Follow-ups and on the
 * lead's timeline.
 */
export function ReminderDialog({ lead, store, onClose, onSaved }: { lead?: Lead; store: DemoStore; onClose: () => void; onSaved: (message: string) => void }) {
  const buyers = store.leads.filter((item) => !item.closed)
  const [leadId, setLeadId] = useState(lead?.id ?? buyers[0]?.id)
  const [title, setTitle] = useState(REMINDER_PRESETS[0].title)
  const [channel, setChannel] = useState<TaskChannel>(REMINDER_PRESETS[0].channel)
  const [{ day, time }, setWhen] = useState(defaultWhen)
  const chosen = store.findLead(leadId ?? -1)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!chosen || !title.trim()) return
    store.addTask(chosen.id, { title: title.trim(), day, time, channel })
    onSaved(`Reminder set · ${dayLabel(day)} at ${time}`)
  }

  return (
    <Dialog label={chosen ? `Remind me about ${chosen.name}` : 'Add a reminder'} onClose={onClose} className="add-lead reminder-dialog">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Follow-up</span>
      <h2>{lead ? `Remind me about ${firstName(lead.name)}` : 'Add a reminder'}</h2>
      <p className="add-lead-intro">It shows in Follow-ups on the day, with a WhatsApp or call button.</p>
      <form onSubmit={submit}>
        {!lead && (
          <label>Buyer
            <select value={leadId} onChange={(event) => setLeadId(Number(event.target.value))}>
              {buyers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.need}</option>)}
            </select>
          </label>
        )}
        <div className="reminder-presets chip-row" role="group" aria-label="Quick picks">
          {REMINDER_PRESETS.map((preset) => (
            <button key={preset.title} type="button" className={`chip ${title === preset.title ? 'active' : ''}`} aria-pressed={title === preset.title} onClick={() => { setTitle(preset.title); setChannel(preset.channel) }}>{preset.title}</button>
          ))}
        </div>
        <label>What to do
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Send the floor plans" />
        </label>
        <div className="form-row">
          <label>Day
            <select value={day} onChange={(event) => setWhen({ day: Number(event.target.value), time })}>
              {DAY_CHOICES.map((offset) => <option key={offset} value={offset}>{dayLabel(offset)}</option>)}
            </select>
          </label>
          <label>Time
            <select value={time} onChange={(event) => setWhen({ day, time: event.target.value })}>{TIMES.map((slot) => <option key={slot.label}>{slot.label}</option>)}</select>
          </label>
        </div>
        <div className="reminder-channel">
          <span>How</span>
          <div className="segmented" role="group" aria-label="How to follow up">
            {CHANNELS.map((option) => <button key={option} type="button" className={channel === option ? 'active' : ''} aria-pressed={channel === option} onClick={() => setChannel(option)}>{option}</button>)}
          </div>
        </div>
        <button className="btn btn-primary btn-block add-lead-submit" disabled={!chosen || !title.trim()}>Set reminder <Icon name="clock" /></button>
      </form>
    </Dialog>
  )
}
