import { mediamtxOverviewController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function GET() { return mediamtxOverviewController() }
