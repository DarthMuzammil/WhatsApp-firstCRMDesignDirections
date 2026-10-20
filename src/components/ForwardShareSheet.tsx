import { Dialog } from './Dialog'
import { Icon, type IconName } from './Icon'
import { APP_NAME } from '../data/brand'
import './ForwardShareSheet.css'

const TARGETS: { key: string; label: string; icon: IconName }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { key: 'bayana', label: APP_NAME, icon: 'bolt' },
  { key: 'messages', label: 'Messages', icon: 'inbox' },
  { key: 'copy', label: 'Copy', icon: 'edit' },
]

/**
 * Demo (🎭, spec §8.17.4): the phone's share sheet after long-pressing a requirement in a broker WhatsApp group.
 * Bayana opens Add lead in paste mode with the message; the other targets just close.
 */
export function ForwardShareSheet({ message, onShareToApp, onClose }: { message: string; onShareToApp: () => void; onClose: () => void }) {
  return (
    <Dialog label="Share to" variant="sheet" onClose={onClose} className="forward-sheet">
      <p className="forward-message"><Icon name="whatsapp" size={14} /> {message}</p>
      <strong className="forward-title">Share to</strong>
      <div className="forward-targets">
        {TARGETS.map((target) => (
          <button key={target.key} className={target.key === 'bayana' ? 'is-app' : ''} onClick={target.key === 'bayana' ? onShareToApp : onClose}>
            <span><Icon name={target.icon} size={22} /></span>{target.label}
          </button>
        ))}
      </div>
    </Dialog>
  )
}
