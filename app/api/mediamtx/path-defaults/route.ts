import { mediamtxPathDefaultsGetController, mediamtxPathDefaultsPatchController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function GET() { return mediamtxPathDefaultsGetController() }
export async function PATCH(request: Request) { return mediamtxPathDefaultsPatchController(request) }
