export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'eventpulse-token'
const SESSION_KEY = 'eventpulse-session'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function handleExpiredSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new CustomEvent('eventpulse-auth-expired'))
}

function queryString(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') search.set(key, value)
  })
  const value = search.toString()
  return value ? `?${value}` : ''
}

async function request(path, options = {}) {
  const token = window.localStorage.getItem(TOKEN_KEY)
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('Unable to reach EventPulse API. Start the backend with `npm start` in the backend folder.', 0)
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) handleExpiredSession()
    throw new ApiError(body?.error || 'The request could not be completed.', response.status, body?.details)
  }
  return body
}

export function login(credentials) { return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }) }
export function register(credentials) { return request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }) }
export function getAuthConfig() { return request('/auth/config') }
export function getGoogleAuthStartUrl(role) { return `${API_BASE_URL}/auth/google?${new URLSearchParams({ role }).toString()}` }
export function getCurrentUser() { return request('/auth/me') }
export function logout() { return request('/auth/logout', { method: 'POST' }) }

export function getAdminOverview() { return request('/admin/overview') }
export function getReportsOverview() { return request('/reports/overview') }

export function getParticipants(params = {}) { return request(`/participants${queryString(params)}`) }
export function createParticipant(participant) { return request('/participants', { method: 'POST', body: JSON.stringify(participant) }) }
export function updateParticipant(id, participant) { return request(`/participants/${id}`, { method: 'PATCH', body: JSON.stringify(participant) }) }
export function deleteParticipant(id) { return request(`/participants/${id}`, { method: 'DELETE' }) }

export function getOrganizers(params = {}) { return request(`/organizers${queryString(params)}`) }
export function createOrganizer(organizer) { return request('/organizers', { method: 'POST', body: JSON.stringify(organizer) }) }
export function updateOrganizer(id, organizer) { return request(`/organizers/${id}`, { method: 'PATCH', body: JSON.stringify(organizer) }) }
export function deleteOrganizer(id) { return request(`/organizers/${id}`, { method: 'DELETE' }) }

export function getMentors(params = {}) { return request(`/mentors${queryString(params)}`) }
export function createMentor(mentor) { return request('/mentors', { method: 'POST', body: JSON.stringify(mentor) }) }
export function updateMentor(id, mentor) { return request(`/mentors/${id}`, { method: 'PATCH', body: JSON.stringify(mentor) }) }
export function deleteMentor(id) { return request(`/mentors/${id}`, { method: 'DELETE' }) }

export function getEvents(params = {}) { return request(`/events${queryString(params)}`) }
export function createEvent(event) { return request('/events', { method: 'POST', body: JSON.stringify(event) }) }
export function updateEvent(id, event) { return request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(event) }) }
export function deleteEvent(id) { return request(`/events/${id}`, { method: 'DELETE' }) }

export function getAnnouncements(params = {}) { return request(`/announcements${queryString(params)}`) }
export function createAnnouncement(announcement) { return request('/announcements', { method: 'POST', body: JSON.stringify(announcement) }) }
export function updateAnnouncement(id, announcement) { return request(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(announcement) }) }
export function deleteAnnouncement(id) { return request(`/announcements/${id}`, { method: 'DELETE' }) }

export function getSettings() { return request('/settings') }
export function updateSettings(settings) { return request('/settings', { method: 'PATCH', body: JSON.stringify(settings) }) }

export function saveToken(token) { window.localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY) }
export function saveSession(user, token) {
  const session = { ...user, token }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new CustomEvent('eventpulse-auth-changed', { detail: session }))
}
export function clearSession() { window.localStorage.removeItem(SESSION_KEY); clearToken(); window.dispatchEvent(new CustomEvent('eventpulse-auth-changed', { detail: null })) }
