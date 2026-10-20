import { useState, type FormEvent } from 'react'
import { bookingStatus, brokerageL, developerOfProject, findProject, reminderText, taxLines, type Booking } from '../data/channelPartner'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { Notify, ToastTone } from '../components/Toast'
import { dayLabel, formatRupees } from '../lib/format'
import type { DemoStore } from '../state/useDemoStore'
import './BookingDialogs.css'

export type BookingAction = 'margin' | 'invoice' | 'payment' | 'dispute' | 'reminder'

/** Today back to 14 days ago, for recording when something happened. */
const PAST_DAYS = Array.from({ length: 15 }, (_, index) => -index)
const DISPUTE_REASONS = ['Developer says another CP registered this buyer first', 'Developer disputes the agreement value', 'Amount differs', 'Other']

/** Four dots: booked → margin money paid → invoice raised → payment received. */
export function MilestoneTrack({ booking }: { booking: Booking }) {
  const steps = [
    { label: 'Booked', done: true },
    { label: 'Margin money paid', done: booking.marginDay !== undefined },
    { label: 'Invoice raised', done: !!booking.invoice },
    { label: 'Payment received', done: !!booking.paid },
  ]
  const reached = steps.filter((step) => step.done).length
  return (
    <span className="milestone-track" role="img" aria-label={`${reached} of 4: ${steps[reached - 1].label}`}>
      {steps.map((step) => <i key={step.label} className={step.done ? 'done' : ''} />)}
    </span>
  )
}

/** One booking: milestones with dates, tax lines, invoice, reminders and what can be done next. */
export function BookingDetail({ booking, store, onClose, onAction, notify }: { booking: Booking; store: DemoStore; onClose: () => void; onAction: (kind: BookingAction) => void; notify: Notify }) {
  const cp = store.cp
  const canManage = store.viewerCan('manageReceivables')
  const project = findProject(booking.projectId)
  const developer = developerOfProject(booking.projectId)
  const status = bookingStatus(booking)
  const lines = taxLines(booking)
  const milestones = [
    { label: 'Booked', day: booking.bookedDay },
    { label: `Margin money paid (${developer?.billableAfterPct}%)`, day: booking.marginDay },
    { label: booking.invoice ? `Invoice ${booking.invoice.number} raised` : 'Invoice raised', day: booking.invoice?.day },
    { label: 'Payment received', day: booking.paid?.day },
  ]
  const canRemind = !!booking.invoice && !booking.paid
  return (
    <Dialog label={`${booking.buyer} · ${project?.name} ${booking.unit}`} variant="sheet" onClose={onClose} className="booking-detail">
      <header className="booking-detail-head">
        <div>
          <span className="eyebrow">{developer?.name}</span>
          <h2>{booking.buyer}</h2>
          <p>{project?.name} {booking.unit} · sold by {cp.agentName(booking)}</p>
        </div>
        <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <div className="dialog-scroll booking-detail-body">
        <p className={`booking-status ${status.kind}`}>{status.label}{status.kind === 'disputed' && <small> · {status.reason}</small>}</p>

        <ol className="booking-milestones">
          {milestones.map((step) => (
            <li key={step.label} className={step.day !== undefined ? 'done' : ''}>
              <span><Icon name={step.day !== undefined ? 'check' : 'clock'} size={14} /></span>
              <strong>{step.label}</strong>
              <small>{step.day !== undefined ? dayLabel(step.day) : 'Not yet'}</small>
            </li>
          ))}
        </ol>

        <dl className="booking-money">
          <div><dt>Agreement value</dt><dd>₹{booking.agreementCr.toFixed(2)} Cr</dd></div>
          <div><dt>Brokerage @ {developer?.brokeragePct}%</dt><dd>{formatRupees(lines.brokerage)}</dd></div>
          <div><dt>GST @ 18%</dt><dd>+ {formatRupees(lines.gst)}</dd></div>
          <div><dt>TDS @ 2%</dt><dd>{formatRupees(-lines.tds)}</dd></div>
          <div className="net"><dt>Net receivable</dt><dd>{formatRupees(lines.net)}</dd></div>
        </dl>
        {booking.invoice && <p className="invoice-chip"><Icon name="download" size={14} /> {booking.invoice.number} · PDF (demo)</p>}

        {booking.reminders.length > 0 && (
          <section className="booking-reminders">
            <span className="eyebrow">Reminders</span>
            {booking.reminders.map((reminder) => (
              <article key={reminder.id}>
                <small>{reminder.tone === 'firm' ? 'Firm' : 'Gentle'} · {reminder.at} · {store.findMember(reminder.byId)?.name}</small>
                <p>{reminder.text}</p>
                {reminder.reply && <p className="reminder-reply"><strong>{developer?.cpManager.name}:</strong> {reminder.reply}</p>}
              </article>
            ))}
          </section>
        )}
      </div>
      <footer className="booking-detail-actions">
        {canManage && status.kind === 'waiting' && <button className="btn btn-primary" onClick={() => onAction('margin')}>Mark margin paid</button>}
        {canManage && status.kind === 'ready' && <button className="btn btn-primary" onClick={() => onAction('invoice')}>Raise invoice</button>}
        {canManage && booking.invoice && !booking.paid && !booking.disputed && <button className="btn btn-primary" onClick={() => onAction('payment')}>Record payment</button>}
        {canRemind && <button className="btn btn-secondary" onClick={() => onAction('reminder')}><Icon name="whatsapp" size={16} /> Send reminder</button>}
        {canManage && !booking.paid && (booking.disputed
          ? <button className="btn btn-secondary" onClick={() => { cp.resolveDispute(booking.id); notify('Dispute resolved') }}>Resolve</button>
          : <button className="btn btn-secondary" onClick={() => onAction('dispute')}>Mark disputed</button>)}
        {canManage && (booking.marginDay !== undefined || booking.invoice || booking.paid) && (
          <button className="btn btn-ghost" onClick={() => { cp.undoLastStep(booking.id); notify('Last step undone') }}><Icon name="refresh" size={16} /> Undo last step</button>
        )}
      </footer>
    </Dialog>
  )
}

/** The recording dialogs (Owner) and the reminder (Owner, Manager). */
export function BookingActionDialog({ kind, booking, store, onClose, onDone }: { kind: BookingAction; booking: Booking; store: DemoStore; onClose: () => void; onDone: (message: string, tone?: ToastTone) => void }) {
  const cp = store.cp
  const project = findProject(booking.projectId)
  const developer = developerOfProject(booking.projectId)
  const lines = taxLines(booking)
  const [day, setDay] = useState(0)
  const [invoiceNumber, setInvoiceNumber] = useState(() => cp.nextInvoiceNumber())
  const [utr, setUtr] = useState('')
  const [tdsCertificate, setTdsCertificate] = useState(false)
  const [reason, setReason] = useState(DISPUTE_REASONS[0])
  const [tone, setTone] = useState<'gentle' | 'firm'>('gentle')
  const message = (which: 'gentle' | 'firm') => reminderText(booking, which, store.viewer.name, booking.invoice ? dayLabel(booking.invoice.day) : '')
  const [text, setText] = useState(() => message('gentle'))

  const titles: Record<BookingAction, string> = {
    margin: 'Margin money paid', invoice: 'Raise invoice', payment: 'Record payment', dispute: 'Mark disputed', reminder: 'Send a reminder',
  }
  const dateSelect = (labelText: string) => (
    <label>{labelText}
      <select value={day} onChange={(event) => setDay(Number(event.target.value))}>{PAST_DAYS.map((offset) => <option key={offset} value={offset}>{dayLabel(offset)}</option>)}</select>
    </label>
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (kind === 'margin') { cp.markMarginPaid(booking.id, day); onDone(`${booking.buyer}: margin money recorded · ready to invoice`) }
    if (kind === 'invoice') { cp.raiseInvoice(booking.id, day, invoiceNumber.trim()); onDone(`Invoice ${invoiceNumber.trim()} raised to ${developer?.name}`) }
    if (kind === 'payment') { cp.recordPayment(booking.id, { day, utr: utr.trim() || undefined, tdsCertificate }); onDone(`Payment of ${formatRupees(lines.net)} recorded`) }
    if (kind === 'dispute') { cp.markDisputed(booking.id, reason); onDone(`${booking.buyer} marked disputed`, 'warning') }
    if (kind === 'reminder') { cp.sendReminder(booking.id, tone, text.trim()); onDone(`Reminder sent to ${developer?.cpManager.name} (${developer?.name})`) }
  }

  return (
    <Dialog label={`${titles[kind]} · ${booking.buyer}`} onClose={onClose} className="add-lead booking-action">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">{developer?.name} · {project?.name} {booking.unit}</span>
      <h2>{titles[kind]}</h2>
      <p className="add-lead-intro">{booking.buyer} · brokerage ₹{brokerageL(booking).toFixed(2)} L ({developer?.brokeragePct}% of ₹{booking.agreementCr.toFixed(2)} Cr)</p>
      <form onSubmit={submit}>
        {kind === 'margin' && dateSelect(`Buyer paid ${developer?.billableAfterPct}% on`)}
        {kind === 'invoice' && <>
          <label>Invoice number<input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} /></label>
          {dateSelect('Invoice date')}
          <p className="booking-action-note">{formatRupees(lines.brokerage)} + GST {formatRupees(lines.gst)} · {developer?.name} pays within {developer?.payDays} days.</p>
        </>}
        {kind === 'payment' && <>
          <div className="booking-action-amount"><span>Amount received</span><strong>{formatRupees(lines.net)}</strong><small>Net of TDS {formatRupees(lines.tds)} · invoice {booking.invoice?.number}</small></div>
          {dateSelect('Received on')}
          <label>UTR / bank reference (optional)<input value={utr} onChange={(event) => setUtr(event.target.value)} placeholder="e.g. HDFCR52026101900045" /></label>
          <label className="checkbox-row"><input type="checkbox" checked={tdsCertificate} onChange={(event) => setTdsCertificate(event.target.checked)} /> TDS certificate received</label>
          <button type="button" className="btn btn-ghost booking-short-pay" onClick={() => { cp.markDisputed(booking.id, 'Amount differs'); onDone(`${booking.buyer} marked disputed · amount differs`, 'warning') }}>Amount differs? Mark disputed</button>
        </>}
        {kind === 'dispute' && (
          <label>Reason<select value={reason} onChange={(event) => setReason(event.target.value)}>{DISPUTE_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        )}
        {kind === 'reminder' && <>
          <div className="segmented" role="group" aria-label="Tone">
            {(['gentle', 'firm'] as const).map((option) => <button key={option} type="button" className={tone === option ? 'active' : ''} aria-pressed={tone === option} onClick={() => { setTone(option); setText(message(option)) }}>{option === 'gentle' ? 'Gentle' : 'Firm'}</button>)}
          </div>
          <label>WhatsApp to {developer?.cpManager.name} · {store.displayPhone(developer?.cpManager.phone ?? '')}
            <textarea rows={6} value={text} onChange={(event) => setText(event.target.value)} />
          </label>
        </>}
        <button className="btn btn-primary btn-block add-lead-submit" disabled={(kind === 'invoice' && !invoiceNumber.trim()) || (kind === 'reminder' && !text.trim())}>
          {{ margin: 'Save', invoice: 'Raise invoice', payment: 'Record payment', dispute: 'Mark disputed', reminder: 'Send on WhatsApp' }[kind]}
        </button>
      </form>
    </Dialog>
  )
}
