import { useState, type FormEvent } from 'react'
import { TAG_SUGGESTIONS } from '../data/demo'
import { Icon } from './Icon'
import './LeadTags.css'

/** Tags on a lead: applied tags as removable chips, plus a picker of suggestions or a custom tag. */
export function LeadTags({ tags, onToggle }: { tags: string[]; onToggle: (tag: string) => void }) {
  const [picking, setPicking] = useState(false)
  const [custom, setCustom] = useState('')
  const suggestions = TAG_SUGGESTIONS.filter((tag) => !tags.includes(tag))

  function addCustom(event: FormEvent) {
    event.preventDefault()
    const tag = custom.trim()
    if (tag && !tags.includes(tag)) onToggle(tag)
    setCustom('')
  }

  return (
    <div className="lead-tags">
      <div className="lead-tags-row">
        {tags.map((tag) => (
          <button key={tag} className="tag-chip applied" onClick={() => onToggle(tag)} aria-label={`Remove tag ${tag}`}>{tag}<Icon name="close" size={12} /></button>
        ))}
        <button className="tag-chip add" aria-expanded={picking} onClick={() => setPicking(!picking)}><Icon name={picking ? 'close' : 'plus'} size={12} />{picking ? 'Done' : 'Tag'}</button>
      </div>
      {picking && (
        <div className="lead-tags-picker">
          {suggestions.map((tag) => <button key={tag} className="tag-chip" onClick={() => onToggle(tag)}>{tag}</button>)}
          <form onSubmit={addCustom}>
            <input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Custom tag" aria-label="Custom tag" maxLength={24} />
          </form>
        </div>
      )}
    </div>
  )
}
