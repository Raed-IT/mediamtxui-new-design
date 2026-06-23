export const runtime = 'nodejs'
import { stopRecordingController } from '@/mvc/controllers/live.controller'
export async function POST(request: Request) { return stopRecordingController(request) }
