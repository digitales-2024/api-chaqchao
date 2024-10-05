import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBadRequestResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { GetCategoryDto } from './dto/get-category.dto';
import { ProductsService } from 'src/modules/admin/products/products.service';
import { ProductData } from 'src/interfaces';
import { GetProductDto } from './dto/get-products.dto';
import { ReportsService } from 'src/modules/admin/reports/report.service';

@ApiTags('Catalog-Shop')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'catalog',
  version: '1'
})
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly productsService: ProductsService,
    private readonly reportsService: ReportsService
  ) {}

  @Get('category')
  async getCategory(@Query() filter: GetCategoryDto, @Res() res: Response) {
    const categories = await this.catalogService.getFilteredCategory(filter);
    res.json(categories);
  }

  @Get('products')
  async getProducts(@Query() filter: GetProductDto, @Res() res: Response) {
    const products = await this.reportsService.getFilteredProducts(filter);
    res.json(products);
  }

  @Get('products/:id')
  async getProductsbyId(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
  }
  @Get('products-category')
  async getProductCategory(@Query() filter: GetCategoryDto, @Res() res: Response) {
    const productCategories = await this.catalogService.getFilteredProductCategory(filter);
    res.json(productCategories);
  }
}
