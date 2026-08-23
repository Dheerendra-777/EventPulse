require('dotenv').config()

const path = require('path')
const fs = require('fs')
const express = require('express')
const app = require('./app')
const port = Number(process.env.PORT || 4000)
const host = process.env.HOST || '0.0.0.0'

// In production Render can serve the Vite build from the same Express service.
// This keeps the browser and API on one origin and avoids production CORS/API URL issues.
const frontendDist = path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.listen(port, host, () => {
  console.log(`EventPulse API listening on ${host}:${port}`)
})
