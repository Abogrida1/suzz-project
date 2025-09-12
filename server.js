const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Simple production-only server
const dev = false // Always production mode
const hostname = '0.0.0.0' // Force all interfaces
const port = parseInt(process.env.PORT, 10) || 10000

console.log(`🚀 Starting Next.js production server on ${hostname}:${port}`)

const app = next({ dev, hostname, port })
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
    console.log(`✅ Production server ready on http://${hostname}:${port}`)
    console.log(`📡 HTTP port ${port} is now OPEN and ready for traffic`)
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
