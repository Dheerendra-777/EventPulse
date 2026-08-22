import { useEffect, useMemo, useState } from 'react'
import { createParticipant, deleteParticipant, getParticipants, updateParticipant } from './api.js'

const participantFields = [
  ['name', 'Full Name', 'text'],
  ['email', 'Email', 'email'],
  ['phone', 'Phone', 'tel'],
  ['event', 'Event', 'text'],
  ['status', 'Status', 'select'],
]

const statusOptions = ['Active', 'Pending', 'Blocked']

function ParticipantSection({ onBack, notify }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [eventFilter, setEventFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const events = [...new Set(data.map((participant) => participant.event))]
  const filtered = useMemo(() => data.filter((participant) => {
    const searchText = `${participant.name} ${participant.email} ${participant.event}`.toLowerCase()
    return searchText.includes(query.toLowerCase()) && (status === 'All' || participant.status === status) && (eventFilter === 'All' || participant.event === eventFilter)
  }), [data, eventFilter, query, status])

  async function refreshParticipants() {
    setLoading(true)
    setRequestError('')
    try { const response = await getParticipants(); setData(response.data || []) } catch (error) { setRequestError(error.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    let cancelled = false
    getParticipants().then((response) => { if (!cancelled) setData(response.data || []) }).catch((error) => { if (!cancelled) setRequestError(error.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function saveParticipant(form) {
    try { if (modal.item) await updateParticipant(modal.item.id, form); else await createParticipant(form); await refreshParticipants() } catch (error) { return { error: error.message } }
    setModal(null)
    notify(`Participant ${modal.item ? 'updated' : 'added'} successfully.`)
    return null
  }

  async function removeParticipant(participant) {
    if (!window.confirm(`Delete ${participant.name}?`)) return
    try { await deleteParticipant(participant.id); await refreshParticipants(); notify('Participant deleted successfully.') } catch (error) { setRequestError(error.message) }
  }

  function resetFilters() { setQuery(''); setStatus('All'); setEventFilter('All') }

  return <><div className="participant-heading"><div><button className="admin-back-link" type="button" onClick={onBack}>← Back to Dashboard</button><span className="admin-kicker">MANAGEMENT / PARTICIPANTS</span><h1>Participants</h1><p>Manage event participants, registration details, and access status.</p></div><button className="admin-primary" type="button" onClick={() => setModal({ item: null })}>＋ Add Participant</button></div>{requestError && <div className="participant-api-error" role="alert">{requestError} <button type="button" onClick={refreshParticipants}>Retry</button></div>}<div className="table-toolbar participant-filters"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or event..." aria-label="Search participants" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter participants by status"><option>All</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} aria-label="Filter participants by event"><option value="All">All events</option>{events.map((event) => <option key={event}>{event}</option>)}</select><button className="filter-reset" type="button" onClick={resetFilters}>Reset filters</button><span className="result-count">{filtered.length} of {data.length}</span></div><div className="admin-table-wrap">{loading ? <div className="participant-loading">Loading participants...</div> : <><table className="admin-table participants-table"><thead><tr><th>Name</th><th>Email</th><th>Event</th><th>Status</th><th>Registration Date</th><th>Actions</th></tr></thead><tbody>{filtered.map((participant) => <tr key={participant.id}><td><strong className="table-name"><span className="table-avatar">{participant.name.slice(0, 2).toUpperCase()}</span>{participant.name}</strong></td><td>{participant.email}</td><td>{participant.event}</td><td><span className={`status-pill ${participant.status.toLowerCase()}`}>{participant.status}</span></td><td>{new Date(participant.registrationDate || '2026-01-15').toLocaleDateString()}</td><td><div className="table-actions"><button type="button" onClick={() => setModal({ item: participant, view: true })}>View</button><button type="button" onClick={() => setModal({ item: participant })}>Edit</button><button type="button" onClick={() => removeParticipant(participant)}>Delete</button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><strong>No participants found</strong><span>Try changing your search or filters.</span><button className="admin-secondary" type="button" onClick={resetFilters}>Reset filters</button></div>}</>}</div>{modal && (modal.view ? <ParticipantDetails participant={modal.item} onClose={() => setModal(null)} /> : <ParticipantModal item={modal.item} onClose={() => setModal(null)} onSave={saveParticipant} />)}</>
}

function ParticipantModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(() => item || { name: '', email: '', phone: '', event: 'Future of Work Summit', status: 'Active', registrationDate: new Date().toISOString().slice(0, 10) })
  const [error, setError] = useState('')
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  async function submit(event) { event.preventDefault(); if (!form.name.trim() || !form.email.trim() || !form.event.trim()) { setError('Full Name, Email, and Event are required.'); return } if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Enter a valid email address.'); return } if (!statusOptions.includes(form.status)) { setError('Select a valid participant status.'); return } const saveError = await onSave(form); if (saveError) setError(saveError.error) }
  return <div className="modal-backdrop"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="participant-modal-title"><div className="modal-heading"><div><span className="admin-kicker">PARTICIPANT RECORD</span><h2 id="participant-modal-title">{item ? 'Edit Participant' : 'Add Participant'}</h2></div><button type="button" onClick={onClose} aria-label="Close participant form">×</button></div><form onSubmit={submit}>{participantFields.map(([field, label, type]) => <label className="modal-field" key={field}><span>{label}{['name', 'email', 'event'].includes(field) ? ' *' : ''}</span>{type === 'select' ? <select value={form[field]} onChange={(event) => update(field, event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select> : <input required={['name', 'email', 'event'].includes(field)} type={type} value={form[field] || ''} onChange={(event) => update(field, event.target.value)} />}</label>)}{error && <span className="field-error" role="alert">{error}</span>}<div className="modal-actions"><button type="button" className="admin-secondary" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary">Save participant</button></div></form></section></div>
}

function ParticipantDetails({ participant, onClose }) {
  return <div className="modal-backdrop"><section className="admin-modal participant-details" role="dialog" aria-modal="true" aria-labelledby="participant-details-title"><div className="modal-heading"><div><span className="admin-kicker">PARTICIPANT DETAILS</span><h2 id="participant-details-title">{participant.name}</h2></div><button type="button" onClick={onClose} aria-label="Close participant details">×</button></div><div className="details-avatar">{participant.name.slice(0, 2).toUpperCase()}</div><dl><div><dt>Email</dt><dd>{participant.email}</dd></div><div><dt>Phone</dt><dd>{participant.phone || 'Not provided'}</dd></div><div><dt>Event</dt><dd>{participant.event}</dd></div><div><dt>Status</dt><dd><span className={`status-pill ${participant.status.toLowerCase()}`}>{participant.status}</span></dd></div><div><dt>Registration Date</dt><dd>{new Date(participant.registrationDate || '2026-01-15').toLocaleDateString()}</dd></div></dl><button className="admin-secondary" type="button" onClick={onClose}>Close details</button></section></div>
}

export default ParticipantSection
