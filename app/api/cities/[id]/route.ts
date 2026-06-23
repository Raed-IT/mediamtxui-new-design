import { deleteCityController, updateCityController } from '@/mvc/controllers/city.controller'
export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return updateCityController(request, Number(id)) }
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) { const { id } = await ctx.params; return deleteCityController(Number(id)) }
