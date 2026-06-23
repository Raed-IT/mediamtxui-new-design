import { mediamtxPathDeleteController, mediamtxPathPatchController, mediamtxPathReplaceController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  return mediamtxPathPatchController(request, name)
}
export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  return mediamtxPathReplaceController(request, name)
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  return mediamtxPathDeleteController(name)
}
