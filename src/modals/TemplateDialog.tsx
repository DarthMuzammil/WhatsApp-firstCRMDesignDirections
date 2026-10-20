import { useState } from 'react'
import { firstName, type Lead } from '../data/demo'
import { FIELD_LABEL, TEMPLATES, fillTemplate, type Template, type TemplateField } from '../data/templates'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import type { DemoStore } from '../state/useDemoStore'
import './TemplateDialog.css'

/** Pick an approved WhatsApp template, fill its fields, preview, send (spec §8.4). Works outside the 24-hour window. */
export function TemplateDialog({ lead, store, onClose, onSend }: { lead: Lead; store: DemoStore; onClose: () => void; onSend: (text: string, label: string) => void }) {
  const [template, setTemplate] = useState<Template>(TEMPLATES[0])
  const [values, setValues] = useState<Record<TemplateField, string>>({
    name: firstName(lead.name),
    property: store.bestMatch(lead).name,
    when: store.upcomingVisits.find((visit) => visit.leadId === lead.id)?.when.replace(' · ', ' at ') ?? 'Saturday at 11:30 AM',
    broker: firstName(store.viewer.name),
  })
  const preview = fillTemplate(template, values)
  const complete = template.fields.every((field) => values[field].trim())

  return (
    <Dialog label="WhatsApp templates" variant="sheet" onClose={onClose} className="template-dialog">
      <header className="assign-head">
        <div><h2>WhatsApp templates</h2><p>Approved messages. They can be sent any time, even after the 24-hour window.</p></div>
        <button className="icon-button bordered" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </header>
      <div className="dialog-scroll">
        <div className="chip-row template-list" role="radiogroup" aria-label="Template">
          {TEMPLATES.map((item) => <button key={item.id} role="radio" aria-checked={template.id === item.id} className={`chip ${template.id === item.id ? 'active' : ''}`} onClick={() => setTemplate(item)}>{item.label}</button>)}
        </div>
        <div className="template-fields">
          {template.fields.map((field) => (
            <label key={field}>{FIELD_LABEL[field]}<input value={values[field]} onChange={(event) => setValues({ ...values, [field]: event.target.value })} /></label>
          ))}
        </div>
        <span className="eyebrow">Preview · {template.category}</span>
        <p className="template-preview">{preview}</p>
      </div>
      <button className="btn btn-primary btn-block assign-confirm" disabled={!complete} onClick={() => onSend(preview, template.label)}><Icon name="send" size={16} /> Send template</button>
    </Dialog>
  )
}
