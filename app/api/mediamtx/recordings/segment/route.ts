import { mediamtxDeleteRecordingSegmentController } from '@/mvc/controllers/mediamtx.controller'
export const runtime = 'nodejs'
export async function DELETE(request: Request) { return mediamtxDeleteRecordingSegmentController(request) }
