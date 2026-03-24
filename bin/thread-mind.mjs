#!/usr/bin/env node

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { homedir } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// Parse CLI args
const args = process.argv.slice(2)
let port = 3000
let noOpen = false
let projectPath = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1])
    i++
  } else if (args[i] === '--no-open') {
    noOpen = true
  } else if (args[i] === '--project' && args[i + 1]) {
    projectPath = resolve(args[i + 1])
    i++
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
ThreadMind - AI-powered thread-based development assistant

Usage: thread-mind [options]

Options:
  --port <number>      Port to run on (default: 3000)
  --project <path>     Target project directory
  --no-open            Don't open browser automatically
  -h, --help           Show this help
`)
    process.exit(0)
  }
}

// Ensure data directory
const dataDir = resolve(homedir(), '.thread-mind')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = resolve(dataDir, 'data.db')

// Set environment variables
process.env.DATABASE_URL = `file:${dbPath}`
process.env.NITRO_PORT = String(port)
process.env.NUXT_TARGET_PROJECT = projectPath || ''

// Run Prisma migrations
console.log('Setting up database...')
try {
  execSync(`npx prisma db push --schema="${resolve(rootDir, 'prisma/schema.prisma')}" --skip-generate`, {
    cwd: rootDir,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
  })
} catch (err) {
  console.error('Database setup failed:', err.message)
  process.exit(1)
}

// Start server
console.log(`\nThreadMind starting on http://localhost:${port}\n`)

try {
  const serverEntry = resolve(rootDir, '.output/server/index.mjs')
  if (existsSync(serverEntry)) {
    // Production: use pre-built output
    await import(serverEntry)
  } else {
    // Development: use nuxt dev
    console.log('No build found, starting in dev mode...')
    const { execSync: exec } = await import('child_process')
    exec(`npx nuxt dev --port ${port}`, {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env },
    })
  }
} catch (err) {
  console.error('Failed to start server:', err.message)
  process.exit(1)
}

// Open browser
if (!noOpen) {
  setTimeout(async () => {
    try {
      const open = (await import('open')).default
      await open(`http://localhost:${port}`)
    } catch {}
  }, 2000)
}
