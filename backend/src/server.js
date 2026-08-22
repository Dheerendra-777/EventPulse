require('dotenv').config()

const app = require('./app')
const port = Number(process.env.PORT || 4000)
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`EventPulse API listening on ${host}:${port}`)
})
