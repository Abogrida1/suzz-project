const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Check if .next directory exists (production build)
const nextDir = path.join(__dirname, '.next')
let hasBuild = fs.existsSync(nextDir)

// If no build exists and we're not in development, build it
if (!hasBuild && process.env.NODE_ENV !== 'development') {
  console.log('🔨 No build found, creating production build...')
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname, timeout: 180000 }) // 3 min timeout
    hasBuild = fs.existsSync(nextDir)
    console.log('✅ Build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    console.log('🔄 Falling back to development mode...')
  }
}

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
    console.log(`🌐 Server listening on all interfaces (${hostname})`)
    console.log(`📡 Port ${port} is now open for HTTP traffic`)
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
