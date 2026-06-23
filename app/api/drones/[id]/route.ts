import { deleteDroneController, updateDroneController } from '@/mvc/controllers/drone.controller'
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return updateDroneController(request, Number(id)) }
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return deleteDroneController(Number(id)) }
