import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductVariationService } from './product-variation.service';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { UpdateProductVariationDto } from './dto/update-product-variation.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';
import { HttpResponse, ProductVariationData, UserData } from 'src/interfaces';
@ApiTags('Products Variation')
@ApiBearerAuth()
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'product-variation',
  version: '1'
})
export class ProductVariationController {
  constructor(private readonly productVariationService: ProductVariationService) {}

  @ApiCreatedResponse({ description: 'Product variation created' })
  @Post()
  create(
    @Body() createProductVariationDto: CreateProductVariationDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductVariationData>> {
    return this.productVariationService.create(createProductVariationDto, user);
  }

  @ApiOkResponse({ description: 'Get all products variation' })
  @Get()
  findAll(): Promise<ProductVariationData[]> {
    return this.productVariationService.findAll();
  }

  @ApiOkResponse({ description: 'Get product variation by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductVariationData> {
    return this.productVariationService.findOne(id);
  }

  @ApiOkResponse({ description: 'Product variation updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductVariationDto: UpdateProductVariationDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductVariationData>> {
    return this.productVariationService.update(id, updateProductVariationDto, user);
  }

  @ApiOkResponse({ description: 'Product variation deleted' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductVariationData>> {
    return this.productVariationService.remove(id, user);
  }
}
