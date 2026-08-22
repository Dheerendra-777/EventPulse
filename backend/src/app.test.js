const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

process.env.DATABASE_PATH = ':memory:'
const app = require('./app')

async function adminToken() {
  const response = await request(app).post('/api/auth/login').send({ email: 'admin@eventpulse.demo', password: 'admin123', role: 'admin' })
  assert.equal(response.status, 200)
  return response.body.token
}

test('health endpoint responds', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.equal(response.body.ok, true)
})

test('CORS allows local Vite frontend ports', async () => {
  for (const origin of ['http://localhost:5173', 'http://localhost:5174']) {
    const response = await request(app).get('/api/health').set('Origin', origin)
    assert.equal(response.status, 200)
    assert.equal(response.headers['access-control-allow-origin'], origin)
  }
})

test('login returns a token and rejects wrong role', async () => {
  const success = await request(app).post('/api/auth/login').send({ email: 'admin@eventpulse.demo', password: 'admin123', role: 'admin' })
  assert.equal(success.status, 200)
  assert.ok(success.body.token)
  const wrongRole = await request(app).post('/api/auth/login').send({ email: 'admin@eventpulse.demo', password: 'admin123', role: 'participant' })
  assert.equal(wrongRole.status, 403)
})

test('auth config reports Google status when OAuth is not configured', async () => {
  const response = await request(app).get('/api/auth/config')
  assert.equal(response.status, 200)
  assert.equal(response.body.google.enabled, false)
  assert.match(response.body.google.message, /not configured/i)
  assert.equal(response.body.passwordReset.enabled, false)
  assert.match(response.body.passwordReset.message, /not configured/i)
})

test('register stores selected role and login returns a usable session token', async () => {
  const email = 'new.organizer@example.com'
  const created = await request(app).post('/api/auth/register').send({ name: 'New Organizer', email, password: 'organizer-pass', role: 'organizer' })
  assert.equal(created.status, 201)
  assert.ok(created.body.token)
  assert.equal(created.body.user.email, email)
  assert.equal(created.body.user.role, 'organizer')

  const login = await request(app).post('/api/auth/login').send({ email, password: 'organizer-pass', role: 'organizer' })
  assert.equal(login.status, 200)
  assert.ok(login.body.token)
  assert.equal(login.body.user.role, 'organizer')

  const current = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`)
  assert.equal(current.status, 200)
  assert.equal(current.body.user.email, email)
  assert.equal(current.body.user.role, 'organizer')
})

test('admin route is protected and participant CRUD works', async () => {
  const token = await adminToken()
  const denied = await request(app).get('/api/admin/overview')
  assert.equal(denied.status, 401)
  const created = await request(app).post('/api/participants').set('Authorization', `Bearer ${token}`).send({ name: 'Test Person', email: 'test.person@example.com', phone: '555-0100', event: 'Future of Work Summit', status: 'Pending' })
  assert.equal(created.status, 201)
  assert.equal(created.body.data.email, 'test.person@example.com')
  const list = await request(app).get('/api/participants').set('Authorization', `Bearer ${token}`)
  assert.equal(list.status, 200)
  assert.ok(list.body.data.some((participant) => participant.email === 'test.person@example.com'))
  const deleted = await request(app).delete(`/api/participants/${created.body.data.id}`).set('Authorization', `Bearer ${token}`)
  assert.equal(deleted.status, 204)
})

test('overview and settings are available to admin', async () => {
  const token = await adminToken()
  const overview = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`)
  assert.equal(overview.status, 200)
  assert.equal(typeof overview.body.data.participants, 'number')
  const settings = await request(app).patch('/api/settings').set('Authorization', `Bearer ${token}`).send({ theme: 'light', timezone: 'UTC+00:00' })
  assert.equal(settings.status, 200)
  assert.equal(settings.body.data.theme, 'light')
})

test('admin resource CRUD endpoints are available', async () => {
  const token = await adminToken()
  const headers = { Authorization: `Bearer ${token}` }
  const organizer = await request(app).post('/api/organizers').set(headers).send({ name: 'Resource Organizer', email: 'resource.organizer@example.com', organization: 'Demo Group', status: 'Active' })
  assert.equal(organizer.status, 201)
  assert.equal((await request(app).get('/api/organizers').set(headers)).status, 200)
  const updatedOrganizer = await request(app).patch(`/api/organizers/${organizer.body.data.id}`).set(headers).send({ name: 'Updated Organizer', email: 'updated.organizer@example.com', organization: 'Updated Group', status: 'Pending' })
  assert.equal(updatedOrganizer.status, 200)
  assert.equal(updatedOrganizer.body.data.name, 'Updated Organizer')
  assert.equal((await request(app).delete(`/api/organizers/${organizer.body.data.id}`).set(headers)).status, 204)
  const mentor = await request(app).post('/api/mentors').set(headers).send({ name: 'Resource Mentor', email: 'resource.mentor@example.com', status: 'Active' })
  assert.equal(mentor.status, 201)
  const updatedMentor = await request(app).patch(`/api/mentors/${mentor.body.data.id}`).set(headers).send({ name: 'Updated Mentor', email: 'updated.mentor@example.com', status: 'Away' })
  assert.equal(updatedMentor.status, 200)
  assert.equal(updatedMentor.body.data.name, 'Updated Mentor')
  assert.equal((await request(app).delete(`/api/mentors/${mentor.body.data.id}`).set(headers)).status, 204)
  const event = await request(app).post('/api/events').set(headers).send({ name: 'Resource Event', date: '2027-01-10', status: 'Draft' })
  assert.equal(event.status, 201)
  assert.equal((await request(app).patch(`/api/events/${event.body.data.id}`).set(headers).send({ name: 'Updated Resource Event', date: '2027-01-11', status: 'Upcoming' })).status, 200)
  assert.equal((await request(app).delete(`/api/events/${event.body.data.id}`).set(headers)).status, 204)
  const announcement = await request(app).post('/api/announcements').set(headers).send({ title: 'Resource announcement', audience: 'All participants', published: false })
  assert.equal(announcement.status, 201)
  assert.equal((await request(app).patch(`/api/announcements/${announcement.body.data.id}`).set(headers).send({ title: 'Updated announcement', audience: 'All participants', published: true })).status, 200)
  assert.equal((await request(app).delete(`/api/announcements/${announcement.body.data.id}`).set(headers)).status, 204)
})
