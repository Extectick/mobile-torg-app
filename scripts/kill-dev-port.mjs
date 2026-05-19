import { execFileSync } from 'node:child_process'
import os from 'node:os'
import 'dotenv/config'

const port = Number(process.env.WEB_PORT || process.env.PORT || process.env.DEV_PORT || 3000)

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid dev port: ${port}`)
  process.exit(1)
}

function getWindowsPids() {
  const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' })

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('LISTENING'))
    .flatMap((line) => {
      const parts = line.split(/\s+/)
      const localAddress = parts[1] || ''
      const pid = Number(parts[parts.length - 1])

      return localAddress.endsWith(`:${port}`) && Number.isInteger(pid) ? [pid] : []
    })
}

function getUnixPids() {
  try {
    return execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' })
      .split(/\s+/)
      .map(Number)
      .filter(Number.isInteger)
  } catch {
    return []
  }
}

const pids = [...new Set(os.platform() === 'win32' ? getWindowsPids() : getUnixPids())]
  .filter((pid) => pid !== process.pid && pid !== process.ppid)

if (pids.length === 0) {
  process.exit(0)
}

console.log(`Stopping previous dev server on port ${port}: ${pids.join(', ')}`)

for (const pid of pids) {
  if (os.platform() === 'win32') {
    execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'inherit' })
  } else {
    process.kill(pid, 'SIGTERM')
  }
}
