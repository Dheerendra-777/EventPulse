const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const db = require('./db')
const { secret, jwt, z, authRequired, requireRole, validate } = require('./middleware')

const app = express()
app.use(helmet())
const defaultFrontendOrigins = ['http://localhost:5173', 'http://localhost:5174']
function configuredFrontendOrigins() {
  const value = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN
  return value ? value.split(',').map((origin) => origin.trim()).filter(Boolean) : defaultFrontendOrigins
}
const frontendOrigins = configuredFrontendOrigins()
app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS origin not allowed: ${origin}`))
  },
  credentials: false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '100kb' }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }))

const publicUser = (user, role) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, status: user.status, role })
const roleForUser = db.prepare('SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?')
const userByEmail = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
const userById = db.prepare('SELECT * FROM users WHERE id = ?')
const authRoles = ['admin', 'organizer', 'mentor', 'participant']
function getRole(id) { return roleForUser.get(id)?.name?.toLowerCase() }
function record(req, action, entity, id) { db.prepare('INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, action, entity, id || null) }
function roleName(role) { return role[0].toUpperCase() + role.slice(1) }
function googleConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) }
function passwordResetConfigured() { return Boolean(process.env.PASSWORD_RESET_URL) }
function frontendAuthRedirect(params) { return `${frontendOrigins[0] || defaultFrontendOrigins[0]}/login#${new URLSearchParams(params).toString()}` }

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'eventpulse-api' }))
app.get('/api/auth/config', (req, res) => {
  res.json({
    google: { enabled: googleConfigured(), message: googleConfigured() ? 'Google sign-in is available.' : 'Google sign-in is not configured for this EventPulse server.' },
    passwordReset: { enabled: passwordResetConfigured(), url: process.env.PASSWORD_RESET_URL || null, message: passwordResetConfigured() ? 'Password reset is available.' : 'Password reset is not configured for this EventPulse server.' },
  })
})
app.post('/api/auth/login', (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1), role: z.enum(authRoles) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Email, password, and role are required.' })
  const user = userByEmail.get(parsed.data.email); const role = user && getRole(user.id)
  if (!user || !bcryptCompare(parsed.data.password, user.password_hash)) return res.status(401).json({ error: 'The email or password is incorrect.' })
  if (role !== parsed.data.role) return res.status(403).json({ error: `This account is registered as ${role}.` })
  const token = jwt.sign({ sub: user.id, role, name: user.name, email: user.email }, secret, { expiresIn: '8h' })
  res.json({ token, user: publicUser(user, role) })
})
app.post('/api/auth/register', (req, res) => {
  const schema = z.object({ name: z.string().trim().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(authRoles) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Name, valid email, password (8+ characters), and role are required.' })
  if (userByEmail.get(parsed.data.email)) return res.status(409).json({ error: 'An account with this email already exists.' })
  const info = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(parsed.data.name, parsed.data.email, require('bcryptjs').hashSync(parsed.data.password, 12))
  const roleRow = db.prepare('SELECT id FROM roles WHERE name=?').get(roleName(parsed.data.role))
  db.prepare('INSERT INTO user_roles (user_id,role_id) VALUES (?,?)').run(info.lastInsertRowid, roleRow.id)
  const user = userById.get(info.lastInsertRowid)
  const token = jwt.sign({ sub: user.id, role: parsed.data.role, name: user.name, email: user.email }, secret, { expiresIn: '8h' })
  res.status(201).json({ token, user: publicUser(user, parsed.data.role) })
})
app.get('/api/auth/google', (req, res) => {
  if (!googleConfigured()) return res.status(501).json({ error: 'Google sign-in is not configured for this EventPulse server.' })
  const parsed = z.object({ role: z.enum(authRoles) }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: 'A valid role is required for Google sign-in.' })
  const state = Buffer.from(JSON.stringify({ role: parsed.data.role })).toString('base64url')
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})
app.get('/api/auth/google/callback', async (req, res) => {
  if (!googleConfigured()) return res.redirect(frontendAuthRedirect({ error: 'Google sign-in is not configured for this EventPulse server.' }))
  let role
  try {
    role = JSON.parse(Buffer.from(String(req.query.state || ''), 'base64url').toString()).role
  } catch {
    return res.redirect(frontendAuthRedirect({ error: 'Google sign-in state was invalid.' }))
  }
  if (!authRoles.includes(role)) return res.redirect(frontendAuthRedirect({ error: 'A valid role is required for Google sign-in.' }))
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(req.query.code || ''),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })
    const tokenBody = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenBody.id_token) throw new Error('Google token exchange failed.')
    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenBody.id_token)}`)
    const profile = await profileResponse.json()
    if (!profileResponse.ok || profile.aud !== process.env.GOOGLE_CLIENT_ID || !profile.email) throw new Error('Google profile verification failed.')
    let user = userByEmail.get(profile.email)
    const existingRole = user && getRole(user.id)
    if (existingRole && existingRole !== role) return res.redirect(frontendAuthRedirect({ error: `This Google account is registered as ${existingRole}.` }))
    if (!user) {
      const info = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(profile.name || profile.email, profile.email, require('bcryptjs').hashSync(require('crypto').randomUUID(), 12))
      const roleRow = db.prepare('SELECT id FROM roles WHERE name=?').get(roleName(role))
      db.prepare('INSERT INTO user_roles (user_id,role_id) VALUES (?,?)').run(info.lastInsertRowid, roleRow.id)
      user = userById.get(info.lastInsertRowid)
    }
    const token = jwt.sign({ sub: user.id, role, name: user.name, email: user.email }, secret, { expiresIn: '8h' })
    res.redirect(frontendAuthRedirect({ token }))
  } catch {
    res.redirect(frontendAuthRedirect({ error: 'Google sign-in could not be completed.' }))
  }
})
app.get('/api/auth/me', authRequired, (req, res) => { const user = userById.get(req.user.sub); if (!user) return res.status(401).json({ error: 'Session user not found.' }); res.json({ user: publicUser(user, getRole(user.id)) }) })
app.post('/api/auth/logout', authRequired, (req, res) => res.status(204).end())

function bcryptCompare(value, hash) { return require('bcryptjs').compareSync(value, hash) }

const resourceConfig = {
  participants: { table: 'event_participants', title: 'Participant', fields: ['name', 'email', 'phone', 'event', 'status', 'registrationDate'], query: `SELECT ep.id, u.name, u.email, u.phone, e.name event, ep.status, ep.registration_date registrationDate FROM event_participants ep JOIN users u ON u.id=ep.user_id JOIN events e ON e.id=ep.event_id`, statuses: ['Active', 'Pending', 'Blocked'] },
  organizers: { table: 'event_organizers', title: 'Organizer', fields: ['name', 'email', 'organization', 'events', 'status'], query: `SELECT eo.id, u.name, u.email, eo.organization, COUNT(DISTINCT eo2.event_id) events, eo.status FROM event_organizers eo JOIN users u ON u.id=eo.user_id LEFT JOIN event_organizers eo2 ON eo2.user_id=eo.user_id`, statuses: ['Active', 'Pending', 'Suspended'] },
  mentors: { table: 'event_mentors', title: 'Mentor', fields: ['name', 'email', 'participants', 'status'], query: `SELECT em.id, u.name, u.email, COUNT(DISTINCT ep.id) participants, em.status FROM event_mentors em JOIN users u ON u.id=em.user_id LEFT JOIN event_participants ep ON ep.mentor_id=em.user_id`, statuses: ['Active', 'Away', 'Suspended'] },
  events: { table: 'events', title: 'Event', fields: ['name', 'date', 'status', 'participants'], query: `SELECT e.id, e.name, e.date, e.status, COUNT(ep.id) participants FROM events e LEFT JOIN event_participants ep ON ep.event_id=e.id`, statuses: ['Live', 'Upcoming', 'Draft'] },
  announcements: { table: 'announcements', title: 'Announcement', fields: ['title', 'audience', 'published', 'date'], query: `SELECT id, title, audience, published, created_at date FROM announcements`, statuses: [] },
}
function getResource(name, req) { const config = resourceConfig[name]; let sql = config.query; const params = []; const search = String(req.query.search || '').trim(); const conditions = []; if (search) { const columns = name === 'events' ? ['e.name'] : name === 'announcements' ? ['title', 'audience'] : ['u.name', 'u.email']; conditions.push(`(${columns.map((column) => `${column} LIKE ?`).join(' OR ')})`); params.push(...columns.map(() => `%${search}%`)) } if (req.query.status && req.query.status !== 'All') { conditions.push('status = ?'); params.push(req.query.status) } if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`; if (name === 'organizers' || name === 'mentors' || name === 'events') sql += ' GROUP BY ' + (name === 'organizers' ? 'eo.id' : name === 'mentors' ? 'em.id' : 'e.id'); return { config, rows: db.prepare(sql).all(...params) } }
app.get('/api/admin/overview', authRequired, requireRole('admin'), (req, res) => { const count = (table, where = '') => db.prepare(`SELECT COUNT(*) count FROM ${table} ${where}`).get().count; res.json({ data: { participants: count('event_participants'), organizers: count('event_organizers'), mentors: count('event_mentors'), activeEvents: count('events', `WHERE status='Live'`), pendingRequests: count('support_requests', `WHERE status='Pending'`), announcements: count('announcements') } }) })
app.get('/api/reports/overview', authRequired, requireRole('admin'), (req, res) => { res.json({ data: { participantGrowth: db.prepare('SELECT registration_date date, COUNT(*) count FROM event_participants GROUP BY registration_date ORDER BY registration_date').all(), events: db.prepare('SELECT status, COUNT(*) count FROM events GROUP BY status').all() } }) })
app.get('/api/settings', authRequired, (req, res) => { const row = db.prepare('SELECT timezone,visibility,email_notifications emailNotifications,weekly_summary weeklySummary,theme FROM settings WHERE user_id=?').get(req.user.sub) || {}; res.json({ data: row }) })
app.get('/api/:resource', authRequired, requireRole('admin'), (req, res) => { const name = req.params.resource; if (!resourceConfig[name]) return res.status(404).json({ error: 'Resource not found.' }); res.json({ data: getResource(name, req).rows }) })
app.get('/api/:resource/:id', authRequired, requireRole('admin'), (req, res) => { const name = req.params.resource; if (!resourceConfig[name]) return res.status(404).json({ error: 'Resource not found.' }); const row = getResource(name, { query: { query: { } } }).rows.find((item) => item.id === Number(req.params.id)); row ? res.json({ data: row }) : res.status(404).json({ error: 'Record not found.' }) })

const baseSchema = z.object({ name: z.string().trim().min(2), email: z.string().email(), phone: z.string().optional(), status: z.string().min(1) })
function ensureUser(body, role) { let user = userByEmail.get(body.email); if (!user) { const info = db.prepare('INSERT INTO users (name,email,password_hash,phone) VALUES (?,?,?,?)').run(body.name, body.email, require('bcryptjs').hashSync('ChangeMe123!', 12), body.phone || null); user = userById.get(info.lastInsertRowid) } const roleRow = db.prepare('SELECT id FROM roles WHERE name=?').get(role); db.prepare('INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES (?,?)').run(user.id, roleRow.id); return user }
app.post('/api/participants', authRequired, requireRole('admin'), validate(baseSchema.extend({ event: z.string().trim().min(2), status: z.enum(['Active', 'Pending', 'Blocked']) })), (req, res) => { const event = db.prepare('SELECT id FROM events WHERE name=?').get(req.body.event); if (!event) return res.status(400).json({ error: 'Event not found.' }); const user = ensureUser(req.body, 'Participant'); const result = db.prepare('INSERT INTO event_participants (user_id,event_id,status) VALUES (?,?,?)').run(user.id, event.id, req.body.status); record(req, 'create', 'participant', result.lastInsertRowid); res.status(201).json({ data: getResource('participants', { query: { query: {} } }).rows.find((row) => row.id === result.lastInsertRowid) }) })
app.patch('/api/participants/:id', authRequired, requireRole('admin'), validate(baseSchema.extend({ event: z.string().trim().min(2), status: z.enum(['Active', 'Pending', 'Blocked']) })), (req, res) => { const current = db.prepare('SELECT user_id FROM event_participants WHERE id=?').get(req.params.id); const event = db.prepare('SELECT id FROM events WHERE name=?').get(req.body.event); if (!current || !event) return res.status(404).json({ error: 'Participant or event not found.' }); db.prepare('UPDATE users SET name=?,email=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name, req.body.email, req.body.phone || null, current.user_id); db.prepare('UPDATE event_participants SET event_id=?,status=? WHERE id=?').run(event.id, req.body.status, req.params.id); record(req, 'update', 'participant', req.params.id); res.json({ data: getResource('participants', { query: { query: {} } }).rows.find((row) => row.id === Number(req.params.id)) }) })
app.delete('/api/participants/:id', authRequired, requireRole('admin'), (req, res) => { const item = db.prepare('SELECT user_id FROM event_participants WHERE id=?').get(req.params.id); if (!item) return res.status(404).json({ error: 'Participant not found.' }); db.prepare('DELETE FROM event_participants WHERE id=?').run(req.params.id); db.prepare("DELETE FROM users WHERE id=? AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=users.id AND ur.role_id != (SELECT id FROM roles WHERE name='Participant'))").run(item.user_id); record(req, 'delete', 'participant', req.params.id); res.status(204).end() })

const personSchema = baseSchema.extend({ organization: z.string().trim().min(2).optional(), events: z.coerce.number().int().min(0).optional(), participants: z.coerce.number().int().min(0).optional() })
function personRoute(name, role, table, relationColumn, relationValue = (body) => body.organization || null) {
  app.post(`/api/${name}`, authRequired, requireRole('admin'), validate(personSchema), (req, res) => { const user = ensureUser(req.body, role); const result = db.prepare(`INSERT INTO ${table} (user_id, ${relationColumn}) VALUES (?, ?)`).run(user.id, relationValue(req.body)); record(req, 'create', name.slice(0, -1), result.lastInsertRowid); res.status(201).json({ data: getResource(name, { query: {} }).rows.find((row) => row.id === result.lastInsertRowid) }) })
  app.patch(`/api/${name}/:id`, authRequired, requireRole('admin'), validate(personSchema), (req, res) => { const relation = db.prepare(`SELECT user_id FROM ${table} WHERE id=?`).get(req.params.id); if (!relation) return res.status(404).json({ error: `${role} not found.` }); db.prepare('UPDATE users SET name=?,email=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name, req.body.email, req.body.phone || null, relation.user_id); db.prepare(`UPDATE ${table} SET ${relationColumn}=?,status=? WHERE id=?`).run(relationValue(req.body), req.body.status, req.params.id); record(req, 'update', name.slice(0, -1), req.params.id); res.json({ data: getResource(name, { query: {} }).rows.find((row) => row.id === Number(req.params.id)) }) })
  app.delete(`/api/${name}/:id`, authRequired, requireRole('admin'), (req, res) => { const relation = db.prepare(`SELECT user_id FROM ${table} WHERE id=?`).get(req.params.id); if (!relation) return res.status(404).json({ error: `${role} not found.` }); db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id); record(req, 'delete', name.slice(0, -1), req.params.id); res.status(204).end() })
}
personRoute('organizers', 'Organizer', 'event_organizers', 'organization')
personRoute('mentors', 'Mentor', 'event_mentors', 'event_id', () => null)

const eventSchema = z.object({ name: z.string().trim().min(2), date: z.string().min(4), status: z.enum(['Live', 'Upcoming', 'Draft']), organization: z.string().optional() })
app.post('/api/events', authRequired, requireRole('admin'), validate(eventSchema), (req, res) => { const result = db.prepare('INSERT INTO events (name,date,status,organization,created_by) VALUES (?,?,?,?,?)').run(req.body.name, req.body.date, req.body.status, req.body.organization || null, req.user.sub); record(req, 'create', 'event', result.lastInsertRowid); res.status(201).json({ data: getResource('events', { query: {} }).rows.find((row) => row.id === result.lastInsertRowid) }) })
app.patch('/api/events/:id', authRequired, requireRole('admin'), validate(eventSchema), (req, res) => { const result = db.prepare('UPDATE events SET name=?,date=?,status=?,organization=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name, req.body.date, req.body.status, req.body.organization || null, req.params.id); if (!result.changes) return res.status(404).json({ error: 'Event not found.' }); record(req, 'update', 'event', req.params.id); res.json({ data: getResource('events', { query: {} }).rows.find((row) => row.id === Number(req.params.id)) }) })
app.delete('/api/events/:id', authRequired, requireRole('admin'), (req, res) => { const result = db.prepare('DELETE FROM events WHERE id=?').run(req.params.id); if (!result.changes) return res.status(404).json({ error: 'Event not found.' }); record(req, 'delete', 'event', req.params.id); res.status(204).end() })

const announcementSchema = z.object({ title: z.string().trim().min(2), content: z.string().optional(), audience: z.string().trim().min(2), published: z.boolean().optional() })
app.post('/api/announcements', authRequired, requireRole('admin'), validate(announcementSchema), (req, res) => { const result = db.prepare('INSERT INTO announcements (title,content,audience,published,created_by,published_at) VALUES (?,?,?,?,?,?)').run(req.body.title, req.body.content || null, req.body.audience, req.body.published ? 1 : 0, req.user.sub, req.body.published ? new Date().toISOString() : null); record(req, 'create', 'announcement', result.lastInsertRowid); res.status(201).json({ data: db.prepare('SELECT id,title,audience,published,created_at date FROM announcements WHERE id=?').get(result.lastInsertRowid) }) })
app.patch('/api/announcements/:id', authRequired, requireRole('admin'), validate(announcementSchema), (req, res) => { const result = db.prepare('UPDATE announcements SET title=?,content=?,audience=?,published=?,published_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.title, req.body.content || null, req.body.audience, req.body.published ? 1 : 0, req.body.published ? new Date().toISOString() : null, req.params.id); if (!result.changes) return res.status(404).json({ error: 'Announcement not found.' }); record(req, 'update', 'announcement', req.params.id); res.json({ data: db.prepare('SELECT id,title,audience,published,created_at date FROM announcements WHERE id=?').get(req.params.id) }) })
app.delete('/api/announcements/:id', authRequired, requireRole('admin'), (req, res) => { const result = db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id); if (!result.changes) return res.status(404).json({ error: 'Announcement not found.' }); record(req, 'delete', 'announcement', req.params.id); res.status(204).end() })

app.get('/api/admin/overview', authRequired, requireRole('admin'), (req, res) => { const count = (table, where = '') => db.prepare(`SELECT COUNT(*) count FROM ${table} ${where}`).get().count; res.json({ data: { participants: count('event_participants'), organizers: count('event_organizers'), mentors: count('event_mentors'), activeEvents: count('events', `WHERE status='Live'`), pendingRequests: count('support_requests', `WHERE status='Pending'`), announcements: count('announcements') } }) })
app.get('/api/reports/overview', authRequired, requireRole('admin'), (req, res) => { res.json({ data: { participantGrowth: db.prepare('SELECT registration_date date, COUNT(*) count FROM event_participants GROUP BY registration_date ORDER BY registration_date').all(), events: db.prepare('SELECT status, COUNT(*) count FROM events GROUP BY status').all() } }) })
app.get('/api/settings', authRequired, (req, res) => { const row = db.prepare('SELECT timezone,visibility,email_notifications emailNotifications,weekly_summary weeklySummary,theme FROM settings WHERE user_id=?').get(req.user.sub) || {}; res.json({ data: row }) })
app.patch('/api/settings', authRequired, validate(z.object({ timezone: z.string().optional(), visibility: z.string().optional(), emailNotifications: z.boolean().optional(), weeklySummary: z.boolean().optional(), theme: z.enum(['dark', 'light', 'system']).optional() })), (req, res) => { db.prepare('INSERT INTO settings (user_id,timezone,visibility,email_notifications,weekly_summary,theme) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET timezone=excluded.timezone,visibility=excluded.visibility,email_notifications=excluded.email_notifications,weekly_summary=excluded.weekly_summary,theme=excluded.theme,updated_at=CURRENT_TIMESTAMP').run(req.user.sub, req.body.timezone || 'UTC-05:00', req.body.visibility || 'Private', req.body.emailNotifications === false ? 0 : 1, req.body.weeklySummary === false ? 0 : 1, req.body.theme || 'dark'); res.json({ data: db.prepare('SELECT timezone,visibility,email_notifications emailNotifications,weekly_summary weeklySummary,theme FROM settings WHERE user_id=?').get(req.user.sub) }) })

app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: 'Internal server error.' }) })
module.exports = app
