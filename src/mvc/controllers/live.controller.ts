import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { getCurrentUser } from '@/lib/auth'
import { ok, fail } from '@/lib/http'
import { listMediaMtxPaths, makeInputUrl, makeWebRtcUrl, patchMediaMtxPathConfig } from '@/lib/mediamtx'
import { listDronesService } from '@/mvc/services/drone.service'

const recorders = new Map<string, { process: ChildProcessWithoutNullStreams; file: string; startedAt: string }>()

function assertPublicDir(folder: string) {
  const dir = path.join(process.cwd(), 'public', folder)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export async function liveDronesController() {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)

  const [drones, paths] = await Promise.all([listDronesService(user), listMediaMtxPaths()])
  const live = drones.flatMap((drone) => {
    const livePath = paths.find((p) => p.ready && (p.name === drone.streamKey || p.name.endsWith(`/${drone.streamKey}`)))
    if (!livePath) return []
    return [{
      ...drone,
      online: true,
      path: livePath,
      webrtcUrl: makeWebRtcUrl(drone.streamKey),
      isRecording: recorders.has(drone.streamKey),
    }]
  })

  return ok(live)
}

export async function startRecordingController(request: Request) {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)
  const { streamKey } = await request.json().catch(() => ({}))
  if (!streamKey) return fail('streamKey is required', 422)
  if (recorders.has(streamKey)) return ok(recorders.get(streamKey))

  const dir = assertPublicDir('recordings')
  const startedAt = new Date().toISOString()
  const safeName = String(streamKey).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-${Date.now()}.mp4`
  const filePath = path.join(dir, filename)
  const input = makeInputUrl(streamKey)

  const child = spawn('ffmpeg', [
    '-y',
    '-rtsp_transport', 'tcp',
    '-i', input,
    '-c', 'copy',
    '-movflags', '+faststart',
    filePath,
  ])

  child.stderr.on('data', () => {})
  child.on('error', () => recorders.delete(streamKey))
  child.on('exit', () => recorders.delete(streamKey))
  recorders.set(streamKey, { process: child, file: `/recordings/${filename}`, startedAt })

  // Also try enabling MediaMTX native recording when the path already has config.
  patchMediaMtxPathConfig(streamKey, { record: true }).catch(() => {})

  return ok({ file: `/recordings/${filename}`, startedAt })
}

export async function stopRecordingController(request: Request) {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)
  const { streamKey } = await request.json().catch(() => ({}))
  if (!streamKey) return fail('streamKey is required', 422)
  const rec = recorders.get(streamKey)
  if (!rec) return ok({ stopped: true, file: null })
  rec.process.kill('SIGINT')
  recorders.delete(streamKey)
  patchMediaMtxPathConfig(streamKey, { record: false }).catch(() => {})
  return ok({ stopped: true, file: rec.file })
}

export async function snapshotController(request: Request) {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)
  const { streamKey } = await request.json().catch(() => ({}))
  if (!streamKey) return fail('streamKey is required', 422)

  const dir = assertPublicDir('snapshots')
  const safeName = String(streamKey).replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}-${Date.now()}.jpg`
  const filePath = path.join(dir, filename)
  const input = makeInputUrl(streamKey)

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('ffmpeg', ['-y', '-rtsp_transport', 'tcp', '-i', input, '-frames:v', '1', '-q:v', '2', filePath])
      child.on('error', reject)
      child.on('exit', (code) => code === 0 ? resolve() : reject(new Error('Failed to capture snapshot. Check ffmpeg and FFMPEG_INPUT_TEMPLATE.')))
    })
    return ok({ file: `/snapshots/${filename}` })
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Snapshot failed', 500)
  }
}
