import { mediamtxGlobalGetController, mediamtxGlobalPatchController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function GET() { return mediamtxGlobalGetController() }
export async function PATCH(request: Request) { return mediamtxGlobalPatchController(request) }
