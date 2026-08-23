import { useEffect, useMemo, useState } from 'react'
import ParticipantSection from './ParticipantSection.jsx'
import OrganizerSection from './OrganizerSection.jsx'
import MentorSection from './MentorSection.jsx'
import {
  createAnnouncement,
  createEvent,
  deleteAnnouncement,
  deleteEvent,
  getAdminOverview,
  getAnnouncements,
  getEvents,
  getReportsOverview,
  getSettings,
  updateAnnouncement,
  updateEvent,
  updateSettings,
} from './api.js'

const navItems = [
  ['overview', 'Overview', '⌂‚'], ['participants', 'Participants', '○'], ['organizers', 'Organizers', '◆'], ['mentors', 'Mentors', '♧'],
  ['events', 'Events', '◌'], ['announcements', 'Announcements', '◇'], ['reports', 'Reports', '▣'], ['settings', 'Settings', '⚙'],
]

function AdminDashboard({ session, onLogout }) {
  const [section, setSection] = useState(() => new URLSearchParams(window.location.search).get('section') || 'overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState(() => window.localStorage.getItem('eventpulse-theme') || 'dark')

  useEffect(() => { window.localStorage.setItem('eventpulse-theme', theme); document.documentElement.dataset.adminTheme = theme }, [theme])
  useEffect(() => { if (theme !== 'system') return undefined; const media = window.matchMedia('(prefers-color-scheme: light)'); const update = () => { document.documentElement.dataset.adminSystemTheme = media.matches ? 'light' : 'dark' }; update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [theme])
  useEffect(() => { const handleThemeChange = () => setTheme(window.localStorage.getItem('eventpulse-theme') || 'dark'); window.addEventListener('eventpulse-theme-change', handleThemeChange); return () => window.removeEventListener('eventpulse-theme-change', handleThemeChange) }, [])
  useEffect(() => { const handleBrandClick = (event) => { if (event.target.closest('.admin-brand .brand')) { event.preventDefault(); selectSection('overview') } }; document.addEventListener('click', handleBrandClick); return () => document.removeEventListener('click', handleBrandClick) }, [])
  useEffect(() => { const handlePopState = () => setSection(new URLSearchParams(window.location.search).get('section') || 'overview'); window.addEventListener('popstate', handlePopState); return () => window.removeEventListener('popstate', handlePopState) }, [])
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(timer) }, [toast])

  function selectSection(next) { setSection(next); setMobileNav(false); window.history.pushState({}, '', next === 'overview' ? '/admin' : `/admin?section=${next}`) }
  function notify(message) { setToast(message) }

  return <div className="admin-app"><aside className={mobileNav ? 'admin-sidebar open' : 'admin-sidebar'}><div className="admin-brand"><a href="/" className="brand"><span className="brand-mark"><i /><i /><i /></span><span>Event<span>Pulse</span></span></a><span className="admin-label">ADMIN CONSOLE</span></div><nav className="admin-nav" aria-label="Admin dashboard navigation">{navItems.map(([id, label, icon]) => <button type="button" className={section === id ? 'active' : ''} onClick={() => selectSection(id)} key={id}><span>{icon}</span>{label}</button>)}</nav><button className="admin-logout" type="button" onClick={onLogout}><span>â†ª</span> Logout</button></aside><div className="admin-content"><header className="admin-topbar"><button className="admin-mobile-toggle" type="button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle admin navigation">â˜°</button><div><span className="admin-breadcrumb">ADMIN / </span><strong>{navItems.find(([id]) => id === section)?.[1]}</strong></div><div className="admin-profile"><span className="admin-avatar">{session.name?.slice(0, 2).toUpperCase() || 'AD'}</span><span><strong>{session.name}</strong><small>Administrator</small></span><button type="button" onClick={onLogout} aria-label="Log out">â†ª</button></div></header><main className="admin-main">{section === 'overview' && <Overview onSelect={selectSection} />}{section === 'participants' && <ParticipantSection notify={notify} onBack={() => selectSection('overview')} />}{section === 'organizers' && <OrganizerSection notify={notify} onBack={() => selectSection('overview')} />}{section === 'mentors' && <MentorSection notify={notify} onBack={() => selectSection('overview')} />}{section === 'events' && <ApiEntitySection type="events" title="Events" subtitle="Track the events powering your community." notify={notify} fields={['name', 'date', 'status', 'participants']} columns={['Event', 'Date', 'Status', 'Participants']} statusOptions={['Live', 'Upcoming', 'Draft']} getItems={getEvents} createItem={createEvent} updateItem={updateEvent} deleteItem={deleteEvent} />}{section === 'announcements' && <ApiEntitySection type="announcements" title="Announcements" subtitle="Publish timely updates to the right audience." notify={notify} fields={['title', 'audience', 'published', 'date']} columns={['Announcement', 'Audience', 'Published', 'Created']} getItems={getAnnouncements} createItem={createAnnouncement} updateItem={updateAnnouncement} deleteItem={deleteAnnouncement} />}{section === 'reports' && <Reports />}{section === 'settings' && <Settings session={session} notify={notify} theme={theme} setTheme={setTheme} />}</main></div>{toast && <div className="admin-toast" role="status">âœ“ {toast}</div>}</div>
}

function Overview({ onSelect }) {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    Promise.all([getAdminOverview(), getEvents()])
      .then(([overview, eventResponse]) => { if (!cancelled) { setStats(overview.data); setEvents(eventResponse.data || []) } })
      .catch((requestError) => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  const cards = [['Total Participants', stats?.participants ?? 0, 'participants', 'â—Œ'], ['Total Organizers', stats?.organizers ?? 0, 'organizers', 'â–¦'], ['Total Mentors', stats?.mentors ?? 0, 'mentors', 'â™§'], ['Active Events', stats?.activeEvents ?? 0, 'events', 'â—«'], ['Pending Requests', stats?.pendingRequests ?? 0, 'announcements', 'â—ˆ'], ['Total Announcements', stats?.announcements ?? 0, 'announcements', 'â–¤']]
  return <><PageHeading eyebrow="OVERVIEW" title="Good morning, Admin" subtitle="Here is what is happening across EventPulse today." />{error && <ApiNotice message={error} />}{loading ? <div className="participant-loading">Loading dashboard...</div> : <><div className="admin-stats">{cards.map(([label, value, target, icon]) => <button type="button" className="admin-stat" onClick={() => onSelect(target)} key={label}><span className="stat-icon">{icon}</span><span>{label}</span><strong>{value}</strong><small>View details â†’</small></button>)}</div><div className="overview-grid"><section className="admin-panel"><PanelHeading title="Recent Activity" action="Live API" /><Activity icon="âœ¦" title="Platform overview loaded" detail="Counts are coming from the EventPulse API" time="now" /><Activity icon="â—ˆ" title="Announcements available" detail={`${stats?.announcements ?? 0} announcements in the backend`} time="now" /><Activity icon="â–¦" title="Events synchronized" detail={`${events.length} events returned by the API`} time="now" /></section><section className="admin-panel"><PanelHeading title="Upcoming Events" action="View events" onClick={() => onSelect('events')} />{events.filter((event) => event.status !== 'Draft').map((event) => <div className="upcoming-event" key={event.id}><div className="event-date"><strong>{new Date(event.date).toLocaleDateString('en-US', { day: '2-digit' })}</strong><small>{new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small></div><div><strong>{event.name}</strong><small>{Number(event.participants || 0).toLocaleString()} participants Â· {event.status}</small></div><span>â†’</span></div>)}{!events.filter((event) => event.status !== 'Draft').length && <div className="empty-state">No upcoming events.</div>}</section></div></>}</>
}

function ApiEntitySection({ type, title, subtitle, notify, fields, columns, statusOptions, getItems, createItem, updateItem, deleteItem }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [modal, setModal] = useState(null)
  const filtered = useMemo(() => data.filter((item) => Object.values(item).join(' ').toLowerCase().includes(query.toLowerCase()) && (status === 'All' || item.status === status)), [data, query, status])
  const statuses = ['All', ...(statusOptions || [...new Set(data.map((item) => item.status).filter(Boolean))])]

  async function refresh() {
    setLoading(true)
    setRequestError('')
    try {
      const response = await getItems({ search: query, status })
      setData(response.data || [])
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let cancelled = false
    getItems().then((response) => { if (!cancelled) setData(response.data || []) }).catch((error) => { if (!cancelled) setRequestError(error.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [getItems])

  async function save(form) {
    try {
      const payload = type === 'events'
        ? { name: form.name, date: form.date, status: form.status, organization: form.organization || undefined }
        : { title: form.title, content: form.content || undefined, audience: form.audience, published: Boolean(form.published) }
      if (modal.item) await updateItem(modal.item.id, payload)
      else await createItem(payload)
      await refresh()
      setModal(null)
      notify(`${title.slice(0, -1)} ${modal.item ? 'updated' : 'added'} successfully.`)
    } catch (error) {
      return { error: error.message }
    }
    return null
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.name || item.title}?`)) return
    try {
      await deleteItem(item.id)
      await refresh()
      notify(`${title.slice(0, -1)} deleted successfully.`)
    } catch (error) {
      setRequestError(error.message)
    }
  }

  async function toggleAnnouncement(item) {
    const result = await save({ ...item, published: !item.published })
    if (!result) notify(item.published ? 'Announcement unpublished.' : 'Announcement published.')
  }

  return <><PageHeading eyebrow="MANAGEMENT" title={title} subtitle={subtitle} action={<button className="admin-primary" type="button" onClick={() => setModal({ item: null })}>ï¼‹ Add {title.slice(0, -1)}</button>} />{requestError && <ApiNotice message={requestError} onRetry={refresh} />}<div className="table-toolbar"><label className="search-field"><span>âŒ•</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={`Filter ${title} by status`}>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="filter-reset" type="button" onClick={refresh}>Apply</button><span className="result-count">{filtered.length} of {data.length}</span></div><div className="admin-table-wrap">{loading ? <div className="participant-loading">Loading {title.toLowerCase()}...</div> : <><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}>{fields.map((field, index) => <td key={field}>{index === 0 ? <strong className="table-name"><span className="table-avatar">{(item[field] || '').slice(0, 2).toUpperCase()}</span>{item[field]}</strong> : field === 'published' ? <span className={item[field] ? 'status-pill active' : 'status-pill draft'}>{item[field] ? 'Published' : 'Unpublished'}</span> : field === 'status' ? <span className={`status-pill ${item[field].toLowerCase()}`}>{item[field]}</span> : field === 'date' ? new Date(item[field]).toLocaleDateString() : item[field]}</td>)}<td><div className="table-actions"><button type="button" onClick={() => setModal({ item })}>Edit</button><button type="button" onClick={() => remove(item)}>Delete</button>{type === 'announcements' && <button type="button" onClick={() => toggleAnnouncement(item)}>{item.published ? 'Unpublish' : 'Publish'}</button>}</div></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">No {title.toLowerCase()} match your search.</div>}</>}</div>{modal && <CrudModal title={`${modal.item ? 'Edit' : 'Add'} ${title.slice(0, -1)}`} type={type} fields={fields} statusOptions={statusOptions} item={modal.item} onClose={() => setModal(null)} onSave={save} />}</>
}

function CrudModal({ title, type, fields, statusOptions = [], item, onClose, onSave }) {
  const defaults = type === 'events' ? { name: '', date: new Date().toISOString().slice(0, 10), status: 'Draft', participants: 0, organization: '' } : { title: '', audience: 'All participants', published: false, date: '', content: '' }
  const [form, setForm] = useState(() => ({ ...defaults, ...item }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const result = await onSave(form)
    if (result?.error) setError(result.error)
    setSaving(false)
  }
  return <div className="modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="admin-kicker">API RECORD</span><h2 id="modal-title">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close modal">Ã—</button></div><form onSubmit={submit}>{fields.filter((field) => !['id', 'participants', 'date'].includes(field) || type === 'events').map((field) => <label className="modal-field" key={field}><span>{field.replace(/([A-Z])/g, ' $1')}</span>{field === 'status' ? <select value={form[field]} onChange={(event) => change(field, event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select> : field === 'published' ? <span className="modal-checkbox"><input type="checkbox" checked={Boolean(form[field])} onChange={(event) => change(field, event.target.checked)} /> Published</span> : <input type={field === 'date' ? 'date' : field === 'email' ? 'email' : 'text'} required={!['participants', 'content'].includes(field)} value={form[field] || ''} onChange={(event) => change(field, event.target.value)} />}</label>)}{type === 'announcements' && <label className="modal-field"><span>Content</span><input type="text" value={form.content || ''} onChange={(event) => change('content', event.target.value)} /></label>}{type === 'events' && <label className="modal-field"><span>Organization</span><input type="text" value={form.organization || ''} onChange={(event) => change('organization', event.target.value)} /></label>}{error && <span className="field-error" role="alert">{error}</span>}<div className="modal-actions"><button type="button" className="admin-secondary" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></div></form></section></div>
}

function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let cancelled = false; getReportsOverview().then((response) => { if (!cancelled) setData(response.data) }).catch((requestError) => { if (!cancelled) setError(requestError.message) }).finally(() => { if (!cancelled) setLoading(false) }); return () => { cancelled = true } }, [])
  const growth = data?.participantGrowth || []
  const maxGrowth = Math.max(...growth.map((item) => item.count), 1)
  const publishedEvents = (data?.events || []).filter((item) => item.status !== 'Draft').reduce((sum, item) => sum + item.count, 0)
  const totalEvents = (data?.events || []).reduce((sum, item) => sum + item.count, 0) || 1
  return <><PageHeading eyebrow="INSIGHTS" title="Reports" subtitle="A simple pulse check across your platform." />{error && <ApiNotice message={error} />}{loading ? <div className="participant-loading">Loading reports...</div> : <div className="report-grid"><div className="admin-panel report-chart"><PanelHeading title="Participant growth" action="Backend data" /><div className="fake-chart">{growth.slice(-7).map((item) => <i style={{ height: `${Math.max(8, (item.count / maxGrowth) * 100)}%` }} key={item.date} />)}{!growth.length && <i />}</div><div className="chart-labels"><span>{growth[0]?.date || 'No data'}</span><span>{growth[Math.floor(growth.length / 2)]?.date || ''}</span><span>{growth.at(-1)?.date || ''}</span></div></div><div className="admin-panel"><PanelHeading title="Platform health" action="Live" />{(data?.events || []).map((item) => <div className="health-row" key={item.status}><span>{item.status} events</span><strong>{item.count}</strong><i><b style={{ width: `${Math.max(5, (item.count / totalEvents) * 100)}%` }} /></i></div>)}<div className="health-row"><span>Published events</span><strong>{publishedEvents}</strong><i><b style={{ width: `${Math.max(5, (publishedEvents / totalEvents) * 100)}%` }} /></i></div></div></div>}</>
}

function Settings({ session, notify, theme, setTheme }) {
  const [form, setForm] = useState({ timezone: 'UTC-05:00', visibility: 'Private', emailNotifications: true, weeklySummary: true, theme })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { let cancelled = false; getSettings().then((response) => { if (!cancelled) { const next = { timezone: response.data?.timezone || 'UTC-05:00', visibility: response.data?.visibility || 'Private', emailNotifications: response.data?.emailNotifications !== 0, weeklySummary: response.data?.weeklySummary !== 0, theme: response.data?.theme || 'dark' }; setForm(next); setTheme(next.theme) } }).catch((requestError) => { if (!cancelled) setError(requestError.message) }).finally(() => { if (!cancelled) setLoading(false) }); return () => { cancelled = true } }, [setTheme])
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await updateSettings(form)
      setForm({ ...form, ...response.data })
      notify('Settings saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  function chooseTheme(value, title) {
    change('theme', value)
    setTheme(value)
    window.localStorage.setItem('eventpulse-theme', value)
    window.dispatchEvent(new Event('eventpulse-theme-change'))
    notify(`${title} theme enabled.`)
  }
  return <><PageHeading eyebrow="CONFIGURATION" title="Settings" subtitle="Tune your EventPulse admin experience." />{error && <ApiNotice message={error} />}{loading ? <div className="participant-loading">Loading settings...</div> : <form className="settings-grid" onSubmit={submit}><section className="admin-panel settings-panel"><h2>Admin profile</h2><label>Full name<input value={session.name} readOnly /></label><label>Email address<input type="email" value={session.email} readOnly /></label></section><section className="admin-panel settings-panel"><h2>Event settings</h2><label>Default timezone<select value={form.timezone} onChange={(event) => change('timezone', event.target.value)}><option value="UTC-05:00">UTC-05:00 Â· Eastern Time</option><option value="UTC+00:00">UTC+00:00 Â· Greenwich Mean Time</option><option value="Asia/Calcutta">Asia/Calcutta</option></select></label><label>Default event visibility<select value={form.visibility} onChange={(event) => change('visibility', event.target.value)}><option>Private</option><option>Public</option></select></label></section><section className="admin-panel settings-panel"><h2>Preferences</h2><label className="setting-toggle"><input type="checkbox" checked={Boolean(form.emailNotifications)} onChange={(event) => change('emailNotifications', event.target.checked)} /> Email notifications</label><label className="setting-toggle"><input type="checkbox" checked={Boolean(form.weeklySummary)} onChange={(event) => change('weeklySummary', event.target.checked)} /> Weekly platform summary</label></section><button className="admin-primary settings-save" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button></form>}<section className="admin-panel theme-panel"><div><span className="admin-kicker">APPEARANCE</span><h2>Theme preference</h2><p>Choose how the Admin Console should look on this device.</p></div><div className="theme-options" role="radiogroup" aria-label="Theme preference">{[['dark', 'Dark', 'EventPulse dark theme'], ['light', 'Light', 'A brighter workspace'], ['system', 'System', 'Follow your device']].map(([value, title, description]) => <label className={theme === value ? 'theme-option selected' : 'theme-option'} key={value}><input type="radio" name="admin-theme" value={value} checked={theme === value} onChange={() => chooseTheme(value, title)} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></section></>
}

function ApiNotice({ message, onRetry }) { return <div className="participant-api-error" role="alert">{message}{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</div> }
function PageHeading({ eyebrow, title, subtitle, action }) { return <div className="admin-page-heading"><div><span className="admin-kicker">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div> }
function PanelHeading({ title, action, onClick }) { return <div className="panel-heading"><h2>{title}</h2><button type="button" onClick={onClick}>{action}</button></div> }
function Activity({ icon, title, detail, time }) { return <div className="activity-item"><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div> }

export default AdminDashboard
