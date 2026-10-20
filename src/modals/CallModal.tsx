import { useEffect, useState } from 'react'
import type { Lead } from '../data/demo'
import { LeadAvatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { formatDuration } from '../lib/format'
import './CallModal.css'

const CONNECT_DELAY_MS = 1200
const CALL_WAVE = [10, 18, 25, 14, 31, 22, 11, 27, 18, 9, 23, 15]

type CallStatus = 'dialling' | 'connected' | 'ended'

/** Simulated internet call: dialling → connected (timer runs) → ended (save recording). */
export function CallModal({ lead, onClose, onSave }: { lead: Lead; onClose: () => void; onSave: (durationSeconds: number) => void }) {
  const [status, setStatus] = useState<CallStatus>('dialling')
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(true)
  const [recording, setRecording] = useState(true)

  useEffect(() => {
    const connect = window.setTimeout(() => setStatus('connected'), CONNECT_DELAY_MS)
    return () => window.clearTimeout(connect)
  }, [])
  useEffect(() => {
    if (status !== 'connected') return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const endCall = () => (status === 'connected' ? setStatus('ended') : onClose())

  return (
    // Escape / clicking outside only cancels while dialling, so a live or unsaved call is never lost by accident.
    <Dialog label={`Call with ${lead.name}`} variant="fullscreen" onClose={onClose} dismissible={status === 'dialling'} className="call-modal">
        <div className="call-security"><i className="status-dot mint" /><Icon name="phone" size={14} /> Secure internet call</div>
        <LeadAvatar lead={lead} size="lg" />
        <h2>{lead.name}</h2>
        <p>{lead.need}</p>
        <div className={`call-status ${status}`} aria-live="polite">
          {status === 'dialling' && 'Calling…'}
          {status === 'connected' && <><i className="status-dot mint" />{formatDuration(seconds)}{recording && <span>REC</span>}</>}
          {status === 'ended' && 'Call ended'}
        </div>
        {status !== 'ended' ? <>
          <div className="call-wave" aria-hidden="true">{CALL_WAVE.map((height, i) => <i key={i} style={{ height }} />)}</div>
          <div className="call-controls">
            <button className={muted ? 'active' : ''} aria-pressed={muted} onClick={() => setMuted(!muted)}><span><Icon name="mic" /></span><small>{muted ? 'Unmute' : 'Mute'}</small></button>
            <button className={speaker ? 'active' : ''} aria-pressed={speaker} onClick={() => setSpeaker(!speaker)}><span><Icon name="volume" /></span><small>Speaker</small></button>
            <button className={recording ? 'recording' : ''} aria-pressed={recording} onClick={() => setRecording(!recording)}><span><i /></span><small>{recording ? 'Recording' : 'Record'}</small></button>
          </div>
          <button className="end-call" onClick={endCall}><Icon name="phone" /><span>{status === 'connected' ? 'End call' : 'Cancel'}</span></button>
        </> : (
          <div className="call-ended">
            <div><span>Duration</span><strong>{formatDuration(seconds)}</strong></div>
            <div><span>Recording</span><strong>{recording ? 'Ready to save' : 'Not recorded'}</strong></div>
            {recording
              ? <button onClick={() => onSave(Math.max(seconds, 1))}>Save recording <Icon name="arrow" /></button>
              : <button onClick={onClose}>Done</button>}
          </div>
        )}
    </Dialog>
  )
}
