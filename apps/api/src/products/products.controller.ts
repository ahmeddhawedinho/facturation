import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, UseInterceptors, UploadedFile, Res, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { Permissions } from '../auth/decorators/permissions.decorator'
import { ProductsService } from './products.service'

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Post()
  @Permissions('products:create')
  async create(@Req() req: any, @Body() createData: any) {
    return this.productsService.create(req.user.companyId, createData, req.user);
  }

  @Get()
  @Permissions('products:read')
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('sku') sku?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.productsService.findAll(req.user.companyId, {
      search,
      sku,
      categoryId,
      subcategoryId,
      sortBy,
      sortOrder,
    });
  }

  @Get('categories')
  @Permissions('products:read')
  async getCategories(@Req() req: any) {
    return this.productsService.getCategories(req.user.companyId);
  }

  @Post('categories')
  @Permissions('products:create')
  async createCategory(@Req() req: any, @Body() data: { name: string }) {
    return this.productsService.createCategory(req.user.companyId, data.name);
  }

  @Post('categories/:id/subcategories')
  @Permissions('products:create')
  async createSubCategory(@Param('id') categoryId: string, @Body() data: { name: string }) {
    return this.productsService.createSubCategory(categoryId, data.name);
  }

  @Get('attributes')
  @Permissions('products:read')
  async getAttributes(@Req() req: any) {
    return this.productsService.getAttributes(req.user.companyId);
  }

  @Post('attributes')
  @Permissions('products:create')
  async createAttribute(@Req() req: any, @Body() data: { name: string, values: string[] }) {
    return this.productsService.createAttribute(req.user.companyId, data.name, data.values);
  }

  @Put('attributes/:id')
  @Permissions('products:update')
  async updateAttribute(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.productsService.updateAttribute(id, req.user.companyId, data);
  }

  @Delete('attributes/:id')
  @Permissions('products:delete')
  async deleteAttribute(@Req() req: any, @Param('id') id: string) {
    return this.productsService.deleteAttribute(id, req.user.companyId);
  }

  @Post('import/woocommerce')
  @Permissions('products:create')
  @UseInterceptors(FileInterceptor('file'))
  async importWooCommerce(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Fichier manquant');
      }
      return await this.productsService.importFromWooCommerceCsv(file.buffer, req.user.companyId);
    } catch (e: any) {
      console.error('CRITICAL IMPORT ERROR:', e);
      throw new BadRequestException('Import failed: ' + (e.message || String(e)));
    }
  }

  @Get('export/woocommerce')
  @Permissions('products:read')
  async exportWooCommerce(@Req() req: any, @Res() res: Response) {
    const csv = await this.productsService.exportToWooCommerceCsv(req.user.companyId);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="products_woocommerce.csv"');
    res.send(csv);
  }

  @Get(':id/stats')
  @Permissions('products:read')
  async getStats(@Req() req: any, @Param('id') id: string) {
    return this.productsService.getProductStats(id, req.user.companyId);
  }

  @Get(':id')
  @Permissions('products:read')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.productsService.findById(id, req.user.companyId);
  }

  @Put(':id')
  @Permissions('products:update')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateData: any) {
    return this.productsService.update(req.user.companyId, id, updateData, req.user);
  }

  @Delete(':id')
  @Permissions('products:delete')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productsService.delete(id, req.user.companyId, req.user);
  }
}
