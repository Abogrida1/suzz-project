const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false // Force production mode
const hostname = '0.0.0.0' // Force all interfaces
const port = parseInt(process.env.PORT, 10) || 10000

console.log(`Starting Next.js server on ${hostname}:${port}`)

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
