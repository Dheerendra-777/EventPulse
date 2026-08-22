const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'eventpulse.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, phone TEXT, status TEXT NOT NULL DEFAULT 'Active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS user_roles (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY (user_id, role_id));
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Draft', organization TEXT, created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS event_participants (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, registration_date TEXT NOT NULL DEFAULT CURRENT_DATE, status TEXT NOT NULL DEFAULT 'Pending', UNIQUE(user_id, event_id));
CREATE TABLE IF NOT EXISTS event_organizers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL, organization TEXT, status TEXT NOT NULL DEFAULT 'Active');
CREATE TABLE IF NOT EXISTS event_mentors (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'Active');
CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT, audience TEXT NOT NULL, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL, published INTEGER NOT NULL DEFAULT 0, published_at TEXT, created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS support_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id INTEGER REFERENCES users(id) ON DELETE CASCADE, event_id INTEGER REFERENCES events(id) ON DELETE CASCADE, mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'Pending', priority TEXT NOT NULL DEFAULT 'Normal', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, timezone TEXT NOT NULL DEFAULT 'UTC-05:00', visibility TEXT NOT NULL DEFAULT 'Private', email_notifications INTEGER NOT NULL DEFAULT 1, weekly_summary INTEGER NOT NULL DEFAULT 1, theme TEXT NOT NULL DEFAULT 'dark', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_user_id INTEGER REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER, metadata TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`)

const roleInsert = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)')
;['Admin', 'Organizer', 'Mentor', 'Participant'].forEach((role) => roleInsert.run(role))

const shouldSeedDemoData = process.env.SEED_DEMO_DATA === 'true' || process.env.NODE_ENV !== 'production'

if (shouldSeedDemoData) {
  const seedUsers = [
    ['Avery Morgan', 'admin@eventpulse.demo', 'admin123', 'Admin'],
    ['Alex Rivera', 'organizer@eventpulse.demo', 'organizer123', 'Organizer'],
    ['Maya Chen', 'mentor@eventpulse.demo', 'mentor123', 'Mentor'],
    ['Jordan Lee', 'participant@eventpulse.demo', 'participant123', 'Participant'],
  ]
  const userInsert = db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash) VALUES (?, ?, ?)')
  const roleId = db.prepare('SELECT id FROM roles WHERE name = ?')
  const userId = db.prepare('SELECT id FROM users WHERE email = ?')
  const roleLink = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)')
  seedUsers.forEach(([name, email, password, role]) => { userInsert.run(name, email, bcrypt.hashSync(password, 12)); roleLink.run(userId.get(email).id, roleId.get(role).id) })

  const eventInsert = db.prepare('INSERT OR IGNORE INTO events (id, name, date, status, organization, created_by) VALUES (?, ?, ?, ?, ?, ?)')
  eventInsert.run(1, 'Future of Work Summit', '2026-09-18', 'Live', 'Northstar Events', userId.get('organizer@eventpulse.demo').id)
  eventInsert.run(2, 'Design Systems Day', '2026-10-04', 'Upcoming', 'Gatherly Collective', userId.get('organizer@eventpulse.demo').id)
  eventInsert.run(3, 'Climate Tech Forum', '2026-11-12', 'Draft', 'Northstar Events', userId.get('organizer@eventpulse.demo').id)
  const eventId = db.prepare('SELECT id FROM events WHERE name=?')
  const participantLink = db.prepare('INSERT OR IGNORE INTO event_participants (user_id,event_id,mentor_id,registration_date,status) VALUES (?,?,?,?,?)')
  participantLink.run(userId.get('participant@eventpulse.demo').id, eventId.get('Future of Work Summit').id, userId.get('mentor@eventpulse.demo').id, '2026-08-02', 'Active')
  const organizerLink = db.prepare('INSERT OR IGNORE INTO event_organizers (user_id,event_id,organization,status) VALUES (?,?,?,?)')
  organizerLink.run(userId.get('organizer@eventpulse.demo').id, eventId.get('Future of Work Summit').id, 'Northstar Events', 'Active')
  const mentorLink = db.prepare('INSERT OR IGNORE INTO event_mentors (user_id,event_id,status) VALUES (?,?,?)')
  mentorLink.run(userId.get('mentor@eventpulse.demo').id, eventId.get('Future of Work Summit').id, 'Active')
}

module.exports = db
