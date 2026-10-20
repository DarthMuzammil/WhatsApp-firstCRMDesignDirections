import { useState, type FormEvent } from 'react'
import { shortName, type Member } from '../data/team'
import type { Note } from '../state/useDemoStore'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import './LeadNotes.css'

/** Private team notes on a lead (not sent to the buyer). */
export function LeadNotes({ notes, onAdd, findMember }: { notes: Note[]; onAdd: (text: string) => void; findMember: (id: string) => Member | undefined }) {
  const [draft, setDraft] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }
  return (
    <div className="lead-notes">
      <form onSubmit={submit}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a note for your team (the buyer won’t see it)…" aria-label="New note" rows={3} />
        <button className="btn btn-primary" disabled={!draft.trim()}><Icon name="plus" size={16} /> Add note</button>
      </form>
      {notes.map((note) => {
        const author = findMember(note.byId)
        return (
          <article key={note.id}>
            {author && <Avatar initials={author.initials} color={author.color} size="sm" />}
            <div><p>{note.text}</p><small>{author ? shortName(author.name) : ''} · {note.at}</small></div>
          </article>
        )
      })}
      {notes.length === 0 && <p className="lead-notes-empty">No notes yet. Add context the next person on this lead should know.</p>}
    </div>
  )
}
