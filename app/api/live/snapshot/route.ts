export const runtime = 'nodejs'
import { snapshotController } from '@/mvc/controllers/live.controller'
export async function POST(request: Request) { return snapshotController(request) }
