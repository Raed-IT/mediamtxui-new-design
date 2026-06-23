import { getCurrentUser } from '@/lib/auth'
import { fail, ok } from '@/lib/http'
import {
  addMediaMtxPathConfig,
  deleteMediaMtxPathConfig,
  deleteMediaMtxRecordingSegment,
  getMediaMtxGlobalConfig,
  getMediaMtxInfo,
  getMediaMtxPathDefaults,
  kickMediaMtxPath,
  kickMediaMtxSession,
  listMediaMtxPathConfigs,
  listMediaMtxPaths,
  listMediaMtxRecordings,
  listMediaMtxSessions,
  patchMediaMtxGlobalConfig,
  patchMediaMtxPathConfig,
  patchMediaMtxPathDefaults,
  replaceMediaMtxPathConfig,
} from '@/lib/mediamtx'

async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user) return { error: fail('Unauthenticated', 401) }
  if (user.role !== 'SUPER_ADMIN') return { error: fail('Only SUPER_ADMIN can control MediaMTX settings', 403) }
  return { user }
}

export async function mediamtxOverviewController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const [info, global, paths, pathConfigs, pathDefaults, sessions, recordings] = await Promise.all([
    getMediaMtxInfo().catch(() => ({})),
    getMediaMtxGlobalConfig(),
    listMediaMtxPaths(),
    listMediaMtxPathConfigs(),
    getMediaMtxPathDefaults().catch(() => ({})),
    listMediaMtxSessions(),
    listMediaMtxRecordings().catch(() => ({ items: [] })),
  ])

  return ok({ info, global, paths, pathConfigs, pathDefaults, sessions, recordings })
}

export async function mediamtxInfoController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  return ok(await getMediaMtxInfo().catch(() => ({})))
}

export async function mediamtxPathsController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const [paths, pathConfigs] = await Promise.all([listMediaMtxPaths(), listMediaMtxPathConfigs()])
  return ok({ paths, pathConfigs })
}

export async function mediamtxSessionsController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  return ok(await listMediaMtxSessions())
}

export async function mediamtxRecordingsController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  return ok(await listMediaMtxRecordings())
}

export async function mediamtxDeleteRecordingSegmentController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  const path = String(body.path || '').trim()
  const start = String(body.start || '').trim()
  if (!path || !start) return fail('path and start are required', 422)
  await deleteMediaMtxRecordingSegment(path, start)
  return ok({ deleted: true })
}

export async function mediamtxGlobalGetController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  return ok(await getMediaMtxGlobalConfig())
}

export async function mediamtxGlobalPatchController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  await patchMediaMtxGlobalConfig(body)
  return ok({ updated: true })
}

export async function mediamtxPathDefaultsGetController() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  return ok(await getMediaMtxPathDefaults())
}

export async function mediamtxPathDefaultsPatchController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  await patchMediaMtxPathDefaults(body)
  return ok({ updated: true })
}

export async function mediamtxPathPatchController(request: Request, name: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  await patchMediaMtxPathConfig(name, body)
  return ok({ updated: true })
}

export async function mediamtxPathReplaceController(request: Request, name: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  await replaceMediaMtxPathConfig(name, body)
  return ok({ updated: true })
}

export async function mediamtxPathAddController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  const name = String(body.name || '').trim()
  if (!name) return fail('Path name is required', 422)
  const { name: _name, ...config } = body
  void _name
  await addMediaMtxPathConfig(name, config)
  return ok({ created: true })
}

export async function mediamtxPathDeleteController(name: string) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  await deleteMediaMtxPathConfig(name)
  return ok({ deleted: true })
}

export async function mediamtxKickController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  const protocol = String(body.protocol || '').trim()
  const id = String(body.id || '').trim()
  if (!protocol || !id) return fail('protocol and id are required', 422)
  await kickMediaMtxSession(protocol, id)
  return ok({ kicked: true })
}

export async function mediamtxKickPathController(request: Request) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({}))
  const path = String(body.path || '').trim()
  if (!path) return fail('path is required', 422)
  return ok(await kickMediaMtxPath(path))
}
