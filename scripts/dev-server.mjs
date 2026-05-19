import { spawn } from 'node:child_process'
import path from 'node:path'
import 'dotenv/config'

const port = Number(process.env.WEB_PORT || process.env.PORT || process.env.DEV_PORT || 3000)
const host = process.env.WEB_HOST || process.env.HOST || '0.0.0.0'

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid dev port: ${port}`)
  process.exit(1)
}

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, 'dev', '--turbopack', '-H', host, '-p', String(port)], {
  env: {
    ...process.env,
    PORT: String(port),
    HOST: host,
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
