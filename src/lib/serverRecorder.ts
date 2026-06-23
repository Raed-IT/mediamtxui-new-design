import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { getMediaMtxPathConfig, patchMediaMtxPathConfig, addMediaMtxPathConfig, listMediaMtxRecordings } from '@/lib/mediamtx'

export type RecorderSession = {
  process?: ChildProcessWithoutNullStreams
  file?: string
  startedAt: string
  input?: string
  mode: 'mediamtx' | 'ffmpeg'
}

export const recorders = new Map<string, RecorderSession>()

export function cleanStreamKey(value: unknown) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '')
}

export function safeFileName(streamKey: string) {
  return streamKey.replace(/[^a-zA-Z0-9_-]/g, '_') || 'stream'
}

export function ensurePublicDir(folder: string) {
  const dir = path.join(process.cwd(), 'public', folder)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function getReadableFfmpegError(stderr: string) {
  const lower = stderr.toLowerCase()
  if (lower.includes('enoent') || lower.includes('spawn ffmpeg enoent')) {
    return 'ffmpeg is not installed on the server. Install it with: sudo apt install -y ffmpeg'
  }
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('authentication')) {
    return 'Server cannot read the stream: authentication failed. Check RTSP/HLS username and password.'
  }
  if (lower.includes('connection refused')) {
    return 'Server cannot connect to MediaMTX. If you use Docker, do not use 127.0.0.1; use the MediaMTX container name or VPS IP.'
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return 'Stream path not found. Check the drone stream key and MediaMTX path name.'
  }
  if (lower.includes('invalid data') || lower.includes('could not find codec')) {
    return 'Server reached the stream but could not decode it. Try HLS input or check codec compatibility.'
  }
  return stderr.split('\n').filter(Boolean).slice(-5).join(' ') || 'Recording failed. Check ffmpeg, stream URL, and MediaMTX ports.'
}

function applyTemplate(template: string, streamKey: string) {
  return template.replaceAll('{streamKey}', encodeURIComponent(streamKey)).replaceAll('{path}', streamKey)
}

export function makeServerInputUrls(streamKey: string) {
  const rtspBase = (process.env.MEDIAMTX_RTSP_BASE_URL || '').replace(/\/$/, '')
  const hlsBase = (process.env.MEDIAMTX_HLS_BASE_URL || '').replace(/\/$/, '')
  const apiHost = (process.env.MEDIAMTX_INTERNAL_HOST || '127.0.0.1').replace(/\/$/, '')
  const rtspUser = process.env.MEDIAMTX_STREAM_USER || process.env.MEDIAMTX_API_USER || 'admin'
  const rtspPass = process.env.MEDIAMTX_STREAM_PASS || process.env.MEDIAMTX_API_PASS || 'admin123'

  const templates = [
    process.env.FFMPEG_INPUT_TEMPLATE,
    process.env.FFMPEG_RTSP_INPUT_TEMPLATE,
    process.env.FFMPEG_HLS_INPUT_TEMPLATE,
    rtspBase ? `${rtspBase}/{streamKey}` : '',
    hlsBase ? `${hlsBase}/{streamKey}/index.m3u8` : '',
    `rtsp://${encodeURIComponent(rtspUser)}:${encodeURIComponent(rtspPass)}@${apiHost}:8554/{streamKey}`,
    `http://${apiHost}:8888/{streamKey}/index.m3u8`,
  ].filter(Boolean) as string[]

  return Array.from(new Set(templates.map((template) => applyTemplate(template, streamKey))))
}

async function waitForFile(filePath: string, child: ChildProcessWithoutNullStreams, stderrRef: () => string) {
  return new Promise<string | null>((resolve) => {
    const started = Date.now()
    const interval = setInterval(() => {
      if (existsSync(filePath) && statSync(filePath).size > 1024) {
        clearInterval(interval)
        resolve(null)
      }
      if (Date.now() - started > 6000) {
        clearInterval(interval)
        resolve(getReadableFfmpegError(stderrRef()))
      }
    }, 500)

    child.once('error', (error) => {
      clearInterval(interval)
      resolve(getReadableFfmpegError(error.message))
    })
    child.once('exit', () => {
      clearInterval(interval)
      resolve(getReadableFfmpegError(stderrRef()))
    })
  })
}

export async function startFfmpegServerRecording(streamKey: string): Promise<RecorderSession> {
  const dir = ensurePublicDir('recordings')
  const startedAt = new Date().toISOString()
  const filename = `${safeFileName(streamKey)}-${Date.now()}.mp4`
  const filePath = path.join(dir, filename)
  const publicFile = `/recordings/${filename}`
  const inputs = makeServerInputUrls(streamKey)
  const errors: string[] = []

  for (const input of inputs) {
    let stderr = ''
    const child = spawn('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'warning',
      '-y',
      '-rtsp_transport', 'tcp',
      '-i', input,
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      filePath,
    ])

    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    const failed = await waitForFile(filePath, child, () => stderr)

    if (!failed) {
      child.on('exit', () => recorders.delete(streamKey))
      const session: RecorderSession = { process: child, file: publicFile, startedAt, input, mode: 'ffmpeg' }
      recorders.set(streamKey, session)
      return session
    }

    try { child.kill('SIGKILL') } catch {}
    if (existsSync(filePath)) unlinkSync(filePath)
    errors.push(`${input}: ${failed}`)
  }

  throw new Error(errors.at(-1) || 'No working server input was found for recording')
}

export async function startMediaMtxNativeRecording(streamKey: string): Promise<RecorderSession> {
  const startedAt = new Date().toISOString()
  const recordPath = process.env.MEDIAMTX_RECORD_PATH || './recordings/%path/%Y-%m-%d_%H-%M-%S-%f'
  const patch = {
    record: true,
    recordPath,
    recordFormat: process.env.MEDIAMTX_RECORD_FORMAT || 'fmp4',
  }

  try {
    await getMediaMtxPathConfig(streamKey)
    await patchMediaMtxPathConfig(streamKey, patch)
  } catch {
    await addMediaMtxPathConfig(streamKey, {
      source: 'publisher',
      ...patch,
    })
  }

  const session: RecorderSession = { startedAt, mode: 'mediamtx' }
  recorders.set(streamKey, session)
  return session
}

export async function stopServerRecording(streamKey: string) {
  const session = recorders.get(streamKey)

  if (session?.mode === 'ffmpeg' && session.process) {
    session.process.kill('SIGINT')
    recorders.delete(streamKey)
    return { stopped: true, mode: 'ffmpeg', file: session.file || null }
  }

  if (session?.mode === 'mediamtx' || process.env.SERVER_RECORDING_MODE === 'mediamtx') {
    await patchMediaMtxPathConfig(streamKey, { record: false }).catch(() => {})
    recorders.delete(streamKey)
    const recordings = await listMediaMtxRecordings().catch(() => ({ items: [] }))
    return { stopped: true, mode: 'mediamtx', file: null, recordings }
  }

  return { stopped: true, file: null }
}

export async function takeServerSnapshot(streamKey: string) {
  const dir = ensurePublicDir('snapshots')
  const filename = `${safeFileName(streamKey)}-${Date.now()}.jpg`
  const filePath = path.join(dir, filename)
  const inputs = makeServerInputUrls(streamKey)
  const errors: string[] = []

  for (const input of inputs) {
    try {
      await new Promise<void>((resolve, reject) => {
        let stderr = ''
        const child = spawn('ffmpeg', [
          '-hide_banner',
          '-loglevel', 'warning',
          '-y',
          '-rtsp_transport', 'tcp',
          '-i', input,
          '-an',
          '-frames:v', '1',
          '-q:v', '2',
          filePath,
        ])

        const timer = setTimeout(() => {
          child.kill('SIGKILL')
          reject(new Error(`timeout while reading ${input}`))
        }, 15000)

        child.stderr.on('data', (chunk) => { stderr += String(chunk) })
        child.on('error', (error) => {
          clearTimeout(timer)
          reject(new Error(getReadableFfmpegError(error.message)))
        })
        child.on('exit', (code) => {
          clearTimeout(timer)
          if (code === 0 && existsSync(filePath) && statSync(filePath).size > 0) resolve()
          else reject(new Error(getReadableFfmpegError(stderr)))
        })
      })
      return { file: `/snapshots/${filename}`, input }
    } catch (error) {
      if (existsSync(filePath)) unlinkSync(filePath)
      errors.push(`${input}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  throw new Error(errors.at(-1) || 'No working server input was found for snapshot')
}
