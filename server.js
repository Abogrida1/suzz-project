const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

// Check if .next directory exists (production build)
const nextDir = path.join(__dirname, '.next')
const hasBuild = fs.existsSync(nextDir)

const dev = !hasBuild || process.env.NODE_ENV === 'development' // Auto-detect mode
const hostname = '0.0.0.0' // Force all interfaces
const port = parseInt(process.env.PORT, 10) || 10000

console.log(`Starting Next.js server on ${hostname}:${port}`)
console.log(`Mode: ${dev ? 'development' : 'production'}`)
console.log(`Build exists: ${hasBuild}`)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  server.listen(port, hostname, () => {
    console.log(`✅ Server ready on http://${hostname}:${port}`)
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
