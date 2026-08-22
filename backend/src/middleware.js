const jwt = require('jsonwebtoken')
const { z } = require('zod')

const secret = process.env.JWT_SECRET || 'eventpulse-development-secret-change-me'

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required.' })
  try { req.user = jwt.verify(token, secret); next() } catch { return res.status(401).json({ error: 'Invalid or expired session.' }) }
}

function requireRole(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'You do not have permission to perform this action.' }) }
function validate(schema) { return (req, res, next) => { const result = schema.safeParse(req.body); if (!result.success) return res.status(400).json({ error: 'Validation failed.', details: result.error.flatten().fieldErrors }); req.body = result.data; next() } }
function asyncHandler(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next) }

module.exports = { secret, jwt, z, authRequired, requireRole, validate, asyncHandler }
