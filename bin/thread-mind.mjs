#!/usr/bin/env node

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import { homedir } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'))

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
  } else if (args[i] === '--version' || args[i] === '-v') {
    console.log(`thread-mind v${pkg.version}`)
    process.exit(0)
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
ThreadMind v${pkg.version} - AI-powered thread-based development assistant

Usage: thread-mind [options]

Options:
  --port <number>      Port to run on (default: 3000)
  --project <path>     Target project directory
  --no-open            Don't open browser automatically
  -v, --version        Show version
  -h, --help           Show this help

Examples:
  npx thread-mind
  npx thread-mind --port 4000
  npx thread-mind --project ./my-app
`)
    process.exit(0)
  }
}

console.log(`\n  ThreadMind v${pkg.version}\n`)

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

// Run Prisma DB push to ensure schema is up-to-date
console.log('  Setting up database...')
try {
  const prismaPath = resolve(rootDir, 'node_modules/.bin/prisma')
  const schemaPath = resolve(rootDir, 'prisma/schema.prisma')
  const cmd = existsSync(prismaPath)
    ? `"${prismaPath}" db push --schema="${schemaPath}" --skip-generate`
    : `npx prisma db push --schema="${schemaPath}" --skip-generate`

  execSync(cmd, {
    cwd: rootDir,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
  })
  console.log('  Database ready.\n')
} catch (err) {
  console.error('  Database setup failed:', err.message)
  process.exit(1)
}

// Start server
const serverEntry = resolve(rootDir, '.output/server/index.mjs')

if (existsSync(serverEntry)) {
  // Production: use pre-built Nitro server
  console.log(`  Starting on http://localhost:${port}\n`)

  await import(serverEntry)

  // Open browser after server is ready
  if (!noOpen) {
    openBrowser(port)
  }
} else {
  // Development: use nuxt dev (non-blocking spawn)
  console.log('  No build found, starting in dev mode...\n')

  const child = spawn('npx', ['nuxt', 'dev', '--port', String(port)], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env },
    shell: true,
  })

  child.on('error', (err) => {
    console.error('Failed to start dev server:', err.message)
    process.exit(1)
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })

  // Open browser after a delay for dev mode
  if (!noOpen) {
    openBrowser(port, 5000)
  }

  // Forward signals to child process
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      child.kill(signal)
    })
  }
}

function openBrowser(port, delay = 1500) {
  setTimeout(async () => {
    try {
      const open = (await import('open')).default
      await open(`http://localhost:${port}`)
    } catch {
      // Silently fail — user can open manually
    }
  }, delay)
}
