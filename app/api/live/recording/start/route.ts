export const runtime = 'nodejs'
import { startRecordingController } from '@/mvc/controllers/live.controller'
export async function POST(request: Request) { return startRecordingController(request) }
