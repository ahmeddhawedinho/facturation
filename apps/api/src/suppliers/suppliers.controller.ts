import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { SuppliersService } from './suppliers.service'

@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) { }

  @Post()
  @Permissions('suppliers:create')
  async create(@Req() req: any, @Body() data: any) {
    return this.suppliersService.create(req.user.companyId, data, req.user)
  }

  @Get()
  @Permissions('suppliers:read')
  async findAll(@Req() req: any) {
    return this.suppliersService.findAll(req.user.companyId)
  }

  @Get(':id')
  @Permissions('suppliers:read')
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.findById(req.user.companyId, id)
  }

  @Put(':id')
  @Permissions('suppliers:update')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.suppliersService.update(req.user.companyId, id, data, req.user)
  }

  @Delete(':id')
  @Permissions('suppliers:delete')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.delete(req.user.companyId, id, req.user)
  }
}
