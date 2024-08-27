import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth, GetUser } from '../auth/decorators';
import { HttpResponse, ProductData, UserData } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Products')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
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

  @ApiOkResponse({ description: 'Get product by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
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
