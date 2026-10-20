import { useEffect, useState } from 'react'
import { firstName, type Lead } from '../data/demo'
import { APP_NAME, BROKERAGE } from '../data/brand'
import { LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { formatDuration } from '../lib/format'
import './CallModal.css'

/** How long each ringing step lasts in the demo (the real call moves on when each phone picks up). */
const AGENT_RING_MS = 1500
const BUYER_RING_MS = 1200
const CALL_WAVE = [10, 18, 25, 14, 31, 22, 11, 27, 18, 9, 23, 15]

/** agent: the agent's own phone rings · buyer: the buyer's phone rings · connected: talking · ended: saved */
type CallStatus = 'agent' | 'buyer' | 'connected' | 'ended'

/**
 * Phone-bridge call (spec §3.6, §8.15), simulated: the telephony provider rings the agent's phone, then the
 * buyer's, and joins them. The buyer sees the firm's number. The talking happens on the agent's phone, so this
 * screen only shows progress and time; the provider records the call. The recording is saved as soon as the
 * call ends (`onEnded`), so closing the end screen can't lose it.
 */
export function CallModal({ lead, onClose, onEnded }: { lead: Lead; onClose: () => void; onEnded: (durationSeconds: number) => void }) {
  const [status, setStatus] = useState<CallStatus>('agent')
  const [seconds, setSeconds] = useState(0)
  const buyer = firstName(lead.name)

  useEffect(() => {
    const toBuyer = window.setTimeout(() => setStatus('buyer'), AGENT_RING_MS)
    const toConnected = window.setTimeout(() => setStatus('connected'), AGENT_RING_MS + BUYER_RING_MS)
    return () => { window.clearTimeout(toBuyer); window.clearTimeout(toConnected) }
  }, [])
  useEffect(() => {
    if (status !== 'connected') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  function endCall() {
    if (status !== 'connected') { onClose(); return }
    const duration = Math.max(seconds, 1)
    setSeconds(duration)
    setStatus('ended')
    onEnded(duration)
  }

  const steps: { id: Exclude<CallStatus, 'ended'>; label: string }[] = [
    { id: 'agent', label: 'Your phone rings' },
    { id: 'buyer', label: `${buyer}'s phone rings` },
    { id: 'connected', label: 'You talk · the call is recorded' },
  ]
  const current = steps.findIndex((step) => step.id === status)

  return (
    // Escape / clicking outside cancels only while your own phone is ringing, so a connecting or live call is never dropped
    // by accident. Once ended, the call is already saved, so the end screen closes normally.
    <Dialog label={`Call with ${lead.name}`} variant="fullscreen" onClose={onClose} dismissible={status === 'agent' || status === 'ended'} className="call-modal">
        <div className="call-number"><Icon name="phone" size={14} /> Calls from {BROKERAGE.name}’s number</div>
        <LeadAvatar lead={lead} size="lg" />
        <h2>{lead.name}</h2>
        <p>{lead.need}</p>
        <div className={`call-status ${status}`} aria-live="polite">
          {status === 'agent' && `${APP_NAME} is calling your phone…`}
          {status === 'buyer' && `Connecting to ${buyer}…`}
          {status === 'connected' && <><i className="status-dot mint" />{formatDuration(seconds)}<span>REC</span></>}
          {status === 'ended' && 'Call ended'}
        </div>
        <p className="call-hint">
          {status === 'agent' && `Pick up to connect to ${buyer}.`}
          {status === 'buyer' && `${buyer} sees ${BROKERAGE.name}’s number, not yours.`}
          {status === 'connected' && `Talk on your phone. ${buyer} heard a short notice that the call is recorded.`}
          {status === 'ended' && `The recording is on ${buyer}’s timeline.`}
        </p>
        {status !== 'ended' ? <>
          <div className="call-wave" aria-hidden="true">{CALL_WAVE.map((height, i) => <i key={i} style={{ height }} />)}</div>
          <ol className="call-steps">
            {steps.map((step, index) => (
              <li key={step.id} className={index < current ? 'done' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}>
                <span>{index < current ? <Icon name="check" size={12} /> : index + 1}</span>{step.label}
              </li>
            ))}
          </ol>
          <button className="end-call" onClick={endCall}><Icon name="phone" /><span>{status === 'connected' ? 'End call' : 'Cancel'}</span></button>
        </> : (
          <div className="call-ended">
            <div><span>Duration</span><strong>{formatDuration(seconds)}</strong></div>
            <div><span>Recording</span><strong>Saved</strong></div>
            <button onClick={onClose}>Done <Icon name="check" /></button>
          </div>
        )}
    </Dialog>
  )
}
