// Builds and serves the app for the e2e suite.
//
// The API proxy destination is baked into the build, so it is pointed at a dead
// local port: even if a test forgot to intercept a request, nothing can reach
// the real public API. Specs answer every /api call from fixtures.
import { spawn } from 'node:child_process'

const port = process.env.E2E_PORT ?? '5180'
const env = {
  ...process.env,
  NEXT_DIST_DIR: '.next-e2e',
  NEXT_PUBLIC_API_URL: 'http://127.0.0.1:9',
  NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:9',
  VITE_API_BASE_URL: 'http://127.0.0.1:9',
  NEXT_TELEMETRY_DISABLED: '1',
}

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['next', ...args], { env, stdio: 'inherit', shell: true })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited ${code}`))))
    child.on('error', reject)
  })
}

await run(['build'])
// `next start` stays in the foreground for Playwright to manage.
await run(['start', '--port', port])
