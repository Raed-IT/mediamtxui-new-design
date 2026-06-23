export type MediaMtxPath = {
  name: string
  confName?: string
  ready?: boolean
  readyTime?: string | null
  source?: { type?: string; id?: string } | null
  readers?: Array<{ type?: string; id?: string }>
  tracks?: string[]
  bytesReceived?: number
  bytesSent?: number
}

export type MediaMtxList<T> = {
  pageCount?: number
  itemCount?: number
  items?: T[]
}

export type MediaMtxInfo = {
  version?: string
  started?: string
  [key: string]: unknown
}

export type MediaMtxSessionsMap = {
  rtmp: MediaMtxSession[]
  webrtc: MediaMtxSession[]
  rtsp: MediaMtxSession[]
  rtspConn: MediaMtxSession[]
  hls: MediaMtxSession[]
  srt: MediaMtxSession[]
}

export type MediaMtxSession = {
  id: string
  created?: string
  remoteAddr?: string
  state?: string
  path?: string
  query?: string
  bytesReceived?: number
  bytesSent?: number
  peerConnectionEstablished?: boolean
  source?: unknown
}

export type MediaMtxRecording = {
  name: string
  segments?: Array<{ start?: string }>
}

function apiBase() {
  return (process.env.MEDIAMTX_API_URL || 'http://localhost:9997').replace(/\/$/, '')
}

function basicAuthHeader() {
  const user = process.env.MEDIAMTX_API_USER || 'admin'
  const pass = process.env.MEDIAMTX_API_PASS || 'admin123'
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

export async function mediaMtxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MediaMTX API failed: ${res.status} ${text}`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

export async function getMediaMtxInfo(): Promise<MediaMtxInfo> {
  return mediaMtxFetch<MediaMtxInfo>('/v3/info')
}

export async function listMediaMtxPaths(): Promise<MediaMtxPath[]> {
  try {
    const json = await mediaMtxFetch<MediaMtxList<MediaMtxPath>>('/v3/paths/list')
    return json.items || []
  } catch {
    return []
  }
}

export async function getMediaMtxPath(name: string) {
  return mediaMtxFetch<MediaMtxPath>(`/v3/paths/get/${encodeURIComponent(name)}`)
}

export async function getMediaMtxGlobalConfig() {
  return mediaMtxFetch<Record<string, unknown>>('/v3/config/global/get')
}

export async function patchMediaMtxGlobalConfig(body: Record<string, unknown>) {
  return mediaMtxFetch('/v3/config/global/patch', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function getMediaMtxPathDefaults() {
  return mediaMtxFetch<Record<string, unknown>>('/v3/config/pathdefaults/get')
}

export async function patchMediaMtxPathDefaults(body: Record<string, unknown>) {
  return mediaMtxFetch('/v3/config/pathdefaults/patch', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function listMediaMtxPathConfigs() {
  return mediaMtxFetch<MediaMtxList<Record<string, unknown>>>('/v3/config/paths/list')
}

export async function getMediaMtxPathConfig(name: string) {
  return mediaMtxFetch<Record<string, unknown>>(`/v3/config/paths/get/${encodeURIComponent(name)}`)
}

export async function patchMediaMtxPathConfig(name: string, body: Record<string, unknown>) {
  return mediaMtxFetch(`/v3/config/paths/patch/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function replaceMediaMtxPathConfig(name: string, body: Record<string, unknown>) {
  return mediaMtxFetch(`/v3/config/paths/replace/${encodeURIComponent(name)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function addMediaMtxPathConfig(name: string, body: Record<string, unknown>) {
  return mediaMtxFetch(`/v3/config/paths/add/${encodeURIComponent(name)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteMediaMtxPathConfig(name: string) {
  return mediaMtxFetch(`/v3/config/paths/delete/${encodeURIComponent(name)}`, { method: 'DELETE' })
}

export async function listMediaMtxSessions(): Promise<MediaMtxSessionsMap> {
  const [rtmp, webrtc, rtsp, rtspConn, hls, srt] = await Promise.allSettled([
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/rtmpconns/list'),
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/webrtcsessions/list'),
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/rtspsessions/list'),
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/rtspconns/list'),
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/hlsmuxers/list'),
    mediaMtxFetch<MediaMtxList<MediaMtxSession>>('/v3/srtconns/list'),
  ])

  return {
    rtmp: rtmp.status === 'fulfilled' ? rtmp.value.items || [] : [],
    webrtc: webrtc.status === 'fulfilled' ? webrtc.value.items || [] : [],
    rtsp: rtsp.status === 'fulfilled' ? rtsp.value.items || [] : [],
    rtspConn: rtspConn.status === 'fulfilled' ? rtspConn.value.items || [] : [],
    hls: hls.status === 'fulfilled' ? hls.value.items || [] : [],
    srt: srt.status === 'fulfilled' ? srt.value.items || [] : [],
  }
}

export async function listMediaMtxRecordings() {
  return mediaMtxFetch<MediaMtxList<MediaMtxRecording>>('/v3/recordings/list')
}

export async function deleteMediaMtxRecordingSegment(path: string, start: string) {
  return mediaMtxFetch(`/v3/recordings/deletesegment?path=${encodeURIComponent(path)}&start=${encodeURIComponent(start)}`, {
    method: 'DELETE',
  })
}

export async function kickMediaMtxSession(protocol: string, id: string) {
  const map: Record<string, string> = {
    rtmp: '/v3/rtmpconns/kick/',
    webrtc: '/v3/webrtcsessions/kick/',
    rtsp: '/v3/rtspsessions/kick/',
    srt: '/v3/srtconns/kick/',
  }
  const base = map[protocol]
  if (!base) throw new Error('Unsupported protocol')
  return mediaMtxFetch(`${base}${encodeURIComponent(id)}`, { method: 'POST' })
}

export async function kickMediaMtxPath(pathName: string) {
  const sessions = await listMediaMtxSessions()
  const tasks: Promise<unknown>[] = []

  for (const [protocol, items] of Object.entries(sessions)) {
    if (!['rtmp', 'webrtc', 'rtsp', 'srt'].includes(protocol)) continue
    for (const item of items as MediaMtxSession[]) {
      if (item.path === pathName && item.id) tasks.push(kickMediaMtxSession(protocol, item.id))
    }
  }

  const path = await getMediaMtxPath(pathName).catch(() => null)
  if (path?.source?.id && path.source.type) {
    const sourceProtocol = String(path.source.type).toLowerCase()
    const sourceId = path.source.id
    if (sourceProtocol.includes('rtmp')) tasks.push(kickMediaMtxSession('rtmp', sourceId))
    if (sourceProtocol.includes('webrtc')) tasks.push(kickMediaMtxSession('webrtc', sourceId))
    if (sourceProtocol.includes('rtsp')) tasks.push(kickMediaMtxSession('rtsp', sourceId))
    if (sourceProtocol.includes('srt')) tasks.push(kickMediaMtxSession('srt', sourceId))
  }

  if (!tasks.length) return { killed: 0 }
  const results = await Promise.allSettled(tasks)
  return { killed: results.filter((r) => r.status === 'fulfilled').length }
}

export function makeWebRtcUrl(streamKey: string) {
  const base = (process.env.NEXT_PUBLIC_WEBRTC_BASE_URL || 'http://localhost:8889').replace(/\/$/, '')
  return `${base}/${streamKey}`
}

function applyTemplate(template: string, streamKey: string) {
  return template.replaceAll('{streamKey}', streamKey)
}

export function makeInputUrls(streamKey: string) {
  const templates = [
    process.env.FFMPEG_INPUT_TEMPLATE,
    process.env.FFMPEG_RTSP_INPUT_TEMPLATE,
    process.env.FFMPEG_HLS_INPUT_TEMPLATE || 'http://127.0.0.1:8888/{streamKey}/index.m3u8',
    'rtsp://127.0.0.1:8554/{streamKey}',
  ].filter(Boolean) as string[]

  return Array.from(new Set(templates.map((template) => applyTemplate(template, streamKey))))
}

export function makeInputUrl(streamKey: string) {
  return makeInputUrls(streamKey)[0]
}
