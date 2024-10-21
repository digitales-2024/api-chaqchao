import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Auth, GetUser } from '../auth/decorators';
import { HttpResponse, ProductData, UserData, UserPayload } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { DeleteProductsDto } from './dto/delete-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({
  path: 'products',
  version: '1'
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiCreatedResponse({ description: 'Product created' })
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.create(createProductDto, user);
  }

  @ApiCreatedResponse({ description: 'Image uploaded' })
  @Post('upload/image')
  @UseInterceptors(FileInterceptor('image')) // Interceptor para manejar la subida de archivos
  async uploadImage(@UploadedFile() image: Express.Multer.File): Promise<HttpResponse<string>> {
    return this.productsService.uploadImage(image);
  }

  @ApiCreatedResponse({ description: 'Image updated' })
  @Patch('update/image/:existingFileName')
  @UseInterceptors(FileInterceptor('image'))
  async updateImage(
    @UploadedFile() image: Express.Multer.File,
    @Param('existingFileName') existingFileName: string
  ): Promise<HttpResponse<string>> {
    return this.productsService.updateImage(image, existingFileName);
  }

  @ApiOkResponse({ description: 'Get all products' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<ProductData[]> {
    return this.productsService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get product by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductData> {
    return this.productsService.findOne(id);
  }

  @ApiOkResponse({ description: 'Product updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() UpdateProductDto: UpdateProductDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.update(id, UpdateProductDto, user);
  }

  @ApiOkResponse({ description: 'Product deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<ProductData>> {
    return this.productsService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Users deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() products: DeleteProductsDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.productsService.removeAll(products, user);
  }

  @ApiOkResponse({ description: 'Product toggle activation' })
  @Patch('toggleactivation/:id')
  toggleActivation(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.toggleActivation(id, user);
  }

  @ApiOkResponse({ description: 'Products reactivated' })
  @Patch('reactivate/all')
  reactivateAll(@GetUser() user: UserData, @Body() products: DeleteProductsDto) {
    return this.productsService.reactivateAll(user, products);
  }

  @ApiOkResponse({ description: 'Product reactivated' })
  @Patch('reactivate/:id')
  reactivate(
    @Param('id') id: string,
    @GetUser() user: UserData
  ): Promise<HttpResponse<ProductData>> {
    return this.productsService.reactivate(id, user);
  }
}
