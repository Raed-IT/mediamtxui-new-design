import { mediamtxPathAddController, mediamtxPathsController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function GET() { return mediamtxPathsController() }
export async function POST(request: Request) { return mediamtxPathAddController(request) }
