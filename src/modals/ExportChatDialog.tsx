import { useState, type FormEvent } from 'react'
import type { Lead } from '../data/demo'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { DemoStore } from '../state/useDemoStore'
import './ExportChatDialog.css'

/**
 * Export one lead's chat (spec §3.2, UI only). Owners only (`exportData`). Nothing is downloaded in the
 * demo: the dialog confirms the export and logs it in the audit log, the way the other exports do.
 */
export function ExportChatDialog({ lead, store, onClose }: { lead: Lead; store: DemoStore; onClose: () => void }) {
  const [format, setFormat] = useState<'txt' | 'csv'>('txt')
  const [includeNotes, setIncludeNotes] = useState(false)
  const [done, setDone] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    store.recordExport(`Exported chat with ${lead.name} (${format === 'txt' ? 'text' : 'spreadsheet'}${includeNotes ? ', with team notes' : ''})`)
    setDone(true)
  }

  return (
    <Dialog label={`Export chat with ${lead.name}`} onClose={onClose} className="add-lead export-chat">
      <button type="button" className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Export</span>
      <h2>Export chat with {lead.name.split(' ')[0]}</h2>
      {done ? (
        <div className="export-chat-done">
          <p><Icon name="check" size={16} /> Chat export ready. <strong>Demo: no file is created.</strong> The export is in the audit log.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>Done</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="add-lead-intro">Every message in this chat, with its time and who sent it. Only the Owner can export.</p>
          <label>Format
            <select value={format} onChange={(event) => setFormat(event.target.value as 'txt' | 'csv')}>
              <option value="txt">Text (.txt), easy to read</option>
              <option value="csv">Spreadsheet (.csv), one row per message</option>
            </select>
          </label>
          <label className="export-chat-check">
            <input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} />
            <span>Include private team notes</span>
          </label>
          <button className="btn btn-primary btn-block add-lead-submit">Export chat <Icon name="download" /></button>
        </form>
      )}
    </Dialog>
  )
}
