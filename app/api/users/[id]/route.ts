import { deleteUserController, updateUserController } from '@/mvc/controllers/user.controller'
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return updateUserController(request, Number(id)) }
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return deleteUserController(Number(id)) }
