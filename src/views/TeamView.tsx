import { useState, type FormEvent } from 'react'
import { initialsFor, type AvatarColor } from '../data/demo'
import { ROLE_LABELS, TEAMS, type Member, type Role, type TeamId } from '../data/team'
import { Avatar } from '../components/Avatar'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { AssignDialog } from '../modals/AssignDialog'
import type { DemoStore } from '../state/useDemoStore'
import './TeamView.css'

const STATUS_LABEL = { active: 'Active', 'on-leave': 'On leave', deactivated: 'Deactivated' } as const
const NEW_MEMBER_COLORS: AvatarColor[] = ['blue', 'coral', 'violet', 'gold']

/** People, teams and roles (spec §8.1). Owner sees everyone; a manager sees their own team. */
export function TeamView({ store, notify }: { store: DemoStore; notify: (message: string) => void }) {
  const [inviting, setInviting] = useState(false)
  const [deactivating, setDeactivating] = useState<Member | null>(null)
  const seesEveryone = store.viewerCan('seeAllLeads')
  const visibleTeams = TEAMS.filter((team) => seesEveryone || team.id === store.viewer.teamId)
  const inScope = store.members.filter((person) => seesEveryone || person.teamId === store.viewer.teamId)
  const count = (status: Member['status']) => inScope.filter((person) => person.status === status).length

  const groups: { key: string; title: string; subtitle: string; people: Member[] }[] = [
    ...visibleTeams.map((team) => ({
      key: team.id,
      title: `${team.name} team`,
      subtitle: `Managed by ${store.findMember(team.managerId)?.name}`,
      people: store.members.filter((person) => person.teamId === team.id),
    })),
    ...(seesEveryone ? [
      { key: 'presales', title: 'Pre-sales', subtitle: store.settings.separatePresales ? 'Qualify new leads, then hand them to Sales' : 'Separate pre-sales is off in Settings', people: store.members.filter((person) => !person.teamId && person.roles.includes('presales')) },
      { key: 'leadership', title: 'Leadership', subtitle: 'Company owner', people: store.members.filter((person) => person.roles.includes('owner')) },
    ] : []),
  ]

  function deactivate(person: Member) {
    if (store.openLeadCount(person.id) > 0) { setDeactivating(person); return }
    store.deactivateMember(person.id, '')
    notify(`${person.name} deactivated`)
  }

  return (
    <section className="team-view">
      <header className="page-head">
        <div>
          <span className="eyebrow">Manage · People</span>
          <h1>{seesEveryone ? 'Team' : `${visibleTeams[0]?.name ?? 'My'} team`}</h1>
          <p>Who’s here, what they handle, and who can see what.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setInviting(true)}><Icon name="plus" /> Invite person</button>
      </header>

      <div className="stat-strip">
        <div><span>Active</span><strong>{count('active')}</strong><small>People handling leads</small></div>
        <div><span>On leave</span><strong>{count('on-leave')}</strong><small>Leads covered by teammates</small></div>
        <div><span>Deactivated</span><strong>{count('deactivated')}</strong><small>No access · leads reassigned</small></div>
      </div>

      <div className="team-groups">
        {groups.map((group) => (
          <section key={group.key} className="card">
            <header className="card-head"><div><h2>{group.title}</h2><p>{group.subtitle} · {group.people.length} {group.people.length === 1 ? 'person' : 'people'}</p></div></header>
            {group.people.map((person) => {
              const isProtected = person.id === store.viewer.id || person.roles.includes('owner')
              return (
                <article key={person.id} className={`team-member ${person.status === 'deactivated' ? 'is-deactivated' : ''}`}>
                  <Avatar initials={person.initials} color={person.color} size="sm" />
                  <span className="team-member-name"><strong>{person.name}{person.id === store.viewer.id ? ' (you)' : ''}</strong><small>{store.displayPhone(person.phone)}</small></span>
                  <span className="team-member-roles">{person.roles.map((role) => <span key={role} className={`role-chip role-${role}`}>{ROLE_LABELS[role]}</span>)}</span>
                  <span className={`member-status status-${person.status}`}>{STATUS_LABEL[person.status]}</span>
                  <span className="team-member-leads"><strong>{store.openLeadCount(person.id)}</strong> open leads</span>
                  <span className="team-member-action">
                    {!isProtected && person.status !== 'deactivated' && <button className="btn btn-secondary" onClick={() => deactivate(person)}>Deactivate</button>}
                    {!isProtected && person.status === 'deactivated' && <button className="btn btn-soft" onClick={() => { store.reactivateMember(person.id); notify(`${person.name} reactivated`) }}>Reactivate</button>}
                  </span>
                </article>
              )
            })}
          </section>
        ))}
      </div>

      {inviting && <InviteDialog store={store} onClose={() => setInviting(false)} onInvited={(person) => { setInviting(false); notify(`Invite sent to ${person.name} on WhatsApp`) }} />}
      {deactivating && (
        <AssignDialog
          title={`Deactivate ${deactivating.name}`}
          description={`${deactivating.name} has ${store.openLeadCount(deactivating.id)} open leads. Choose who takes them over; access is removed straight after.`}
          candidates={store.assignableMembers.filter((person) => person.id !== deactivating.id && person.status === 'active')}
          openLeadCount={store.openLeadCount}
          confirmLabel="Move leads and deactivate"
          onConfirm={(memberId) => {
            store.deactivateMember(deactivating.id, memberId)
            notify(`${deactivating.name} deactivated · leads moved to ${store.findMember(memberId)?.name}`)
            setDeactivating(null)
          }}
          onClose={() => setDeactivating(null)}
        />
      )}
    </section>
  )
}

/** Simulated invite: adds the person straight away and pretends a WhatsApp invite went out. */
function InviteDialog({ store, onClose, onInvited }: { store: DemoStore; onClose: () => void; onInvited: (person: Member) => void }) {
  const seesEveryone = store.viewerCan('seeAllLeads')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('sales')
  const [teamId, setTeamId] = useState<TeamId | ''>(store.viewer.teamId ?? 'indiranagar')
  const roleOptions: Role[] = seesEveryone ? ['sales', 'presales', 'manager'] : ['sales']

  function submit(event: FormEvent) {
    event.preventDefault()
    const id = `m-${Date.now()}`
    const person: Member = {
      id,
      name: name.trim(),
      initials: initialsFor(name),
      color: NEW_MEMBER_COLORS[Date.now() % NEW_MEMBER_COLORS.length],
      roles: [role],
      teamId: role === 'presales' || !teamId ? undefined : teamId,
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      status: 'active',
    }
    store.inviteMember(person)
    onInvited(person)
  }

  return (
    <Dialog label="Invite person" onClose={onClose} className="add-lead">
      <button className="icon-button bordered add-lead-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <span className="eyebrow">Team</span>
      <h2>Invite person</h2>
      <p className="add-lead-intro">They’ll get a WhatsApp link to join. You can change their role later.</p>
      <form onSubmit={submit}>
        <label>Full name<input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Rakesh Gupta" autoComplete="off" /></label>
        <label>Mobile number
          <div className="phone-input"><span>+91</span><input required inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" /></div>
        </label>
        <div className="form-row">
          <label>Role
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roleOptions.map((option) => <option key={option} value={option}>{ROLE_LABELS[option]}</option>)}</select>
          </label>
          <label>Team
            <select value={role === 'presales' ? '' : teamId} disabled={!seesEveryone || role === 'presales'} onChange={(event) => setTeamId(event.target.value as TeamId)}>
              {role === 'presales' && <option value="">Central pre-sales</option>}
              {TEAMS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
        </div>
        <button className="btn btn-primary btn-block add-lead-submit">Send invite <Icon name="whatsapp" /></button>
      </form>
    </Dialog>
  )
}

