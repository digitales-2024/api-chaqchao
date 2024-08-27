import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth, GetUser } from '../auth/decorators';
import { HttpResponse, ProductData, UserData } from 'src/interfaces';
import { ApiOkResponse } from '@nestjs/swagger';

@Auth()
@Controller({
  path: 'products',
  version: '1'
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @ApiOkResponse({ description: 'Product desactivated' })
  @Patch('desactivate/:id')
  desactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.desactivate(id, user);
  }
}
