import { getCurrentUser } from '@/lib/auth'
import { ok, fail } from '@/lib/http'
import { listMediaMtxPaths, makeWebRtcUrl, type MediaMtxPath } from '@/lib/mediamtx'
import { listDronesService } from '@/mvc/services/drone.service'
type DroneAccess = { streamKey: string; name: string; [key: string]: unknown }

import {
  cleanStreamKey,
  recorders,
  startFfmpegServerRecording,
  startMediaMtxNativeRecording,
  stopServerRecording,
  takeServerSnapshot,
} from '@/lib/serverRecorder'

async function assertStreamAllowed(streamKey: string) {
  const user = await getCurrentUser()
  if (!user) return { error: fail('Unauthenticated', 401) }

  const drones = (await listDronesService(user)) as DroneAccess[]
  const allowed = drones.some((drone: DroneAccess) => drone.streamKey === streamKey || drone.name === streamKey)
  if (!allowed && user.role !== 'SUPER_ADMIN') return { error: fail('You are not allowed to control this stream', 403) }

  return { user }
}

export async function liveDronesController() {
  const user = await getCurrentUser()
  if (!user) return fail('Unauthenticated', 401)

  const [dronesResult, pathsResult] = await Promise.all([listDronesService(user), listMediaMtxPaths()])
  const drones = dronesResult as DroneAccess[]
  const paths = pathsResult as MediaMtxPath[]
  const live = drones.flatMap((drone: DroneAccess) => {
    const livePath = paths.find((p: MediaMtxPath) => p.ready && (p.name === drone.streamKey || p.name.endsWith(`/${drone.streamKey}`)))
    if (!livePath) return []
    return [{
      ...drone,
      online: true,
      path: livePath,
      webrtcUrl: makeWebRtcUrl(drone.streamKey),
      isRecording: recorders.has(drone.streamKey),
      recordingMode: recorders.get(drone.streamKey)?.mode || null,
    }]
  })

  return ok(live)
}

export async function startRecordingController(request: Request) {
  const { streamKey: rawStreamKey, mode: rawMode } = await request.json().catch(() => ({}))
  const streamKey = cleanStreamKey(rawStreamKey)
  if (!streamKey) return fail('streamKey is required', 422)

  const auth = await assertStreamAllowed(streamKey)
  if ('error' in auth) return auth.error

  const existing = recorders.get(streamKey)
  if (existing) return ok(existing)

  const mode = String(rawMode || process.env.SERVER_RECORDING_MODE || 'mediamtx').toLowerCase()

  try {
    if (mode === 'ffmpeg') {
      const session = await startFfmpegServerRecording(streamKey)
      return ok(session)
    }

    const session = await startMediaMtxNativeRecording(streamKey)
    return ok({
      ...session,
      message: 'Server-side MediaMTX recording enabled for this path. Files are saved by MediaMTX on the server.',
    })
  } catch (mediaMtxError) {
    // If native MediaMTX recording cannot be enabled, fallback to direct server ffmpeg recording.
    try {
      const session = await startFfmpegServerRecording(streamKey)
      return ok({
        ...session,
        fallback: true,
        warning: mediaMtxError instanceof Error ? mediaMtxError.message : 'Native MediaMTX recording failed, ffmpeg fallback used.',
      })
    } catch (ffmpegError) {
      return fail(
        ffmpegError instanceof Error
          ? ffmpegError.message
          : 'Server recording failed. Check MediaMTX recording config or ffmpeg input URLs.',
        500
      )
    }
  }
}

export async function stopRecordingController(request: Request) {
  const { streamKey: rawStreamKey } = await request.json().catch(() => ({}))
  const streamKey = cleanStreamKey(rawStreamKey)
  if (!streamKey) return fail('streamKey is required', 422)

  const auth = await assertStreamAllowed(streamKey)
  if ('error' in auth) return auth.error

  try {
    return ok(await stopServerRecording(streamKey))
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Could not stop server recording', 500)
  }
}

export async function snapshotController(request: Request) {
  const { streamKey: rawStreamKey } = await request.json().catch(() => ({}))
  const streamKey = cleanStreamKey(rawStreamKey)
  if (!streamKey) return fail('streamKey is required', 422)

  const auth = await assertStreamAllowed(streamKey)
  if ('error' in auth) return auth.error

  try {
    return ok(await takeServerSnapshot(streamKey))
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Snapshot failed', 500)
  }
}
