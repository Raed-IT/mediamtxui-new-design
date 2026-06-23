import { mediamtxKickPathController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function POST(request: Request) { return mediamtxKickPathController(request) }
