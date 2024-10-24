import { Controller, Post, Body, Get, Delete, Param, Patch } from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateQuantityCartItemDto } from './dto/update-cart-item.dto';
import { Auth } from 'src/modules/admin/auth/decorators';
import { HttpResponse } from 'src/interfaces';
import { CartItemData } from 'src/interfaces/cart-item.interface';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse
} from '@nestjs/swagger';

@ApiTags('CartItem')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'UnAuthorized' })
@Auth()
@Controller({
  path: 'cart-item',
  version: '1'
})
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  @ApiCreatedResponse({ description: 'Cart Item Created' })
  @Post()
  create(@Body() createCartItemDto: CreateCartItemDto): Promise<HttpResponse<CartItemData>> {
    return this.cartItemService.create(createCartItemDto);
  }

  @ApiOkResponse({ description: 'Get all carts item' })
  @Get()
  findAll(): Promise<CartItemData[]> {
    return this.cartItemService.findAll();
  }

  @ApiOkResponse({ description: 'Product deleted' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<HttpResponse<CartItemData>> {
    return this.cartItemService.remove(id);
  }

  @ApiOkResponse({ description: 'Cart item quantity updated' })
  @Patch(':id')
  updateQuantity(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateQuantityCartItemDto
  ): Promise<HttpResponse<CartItemData>> {
    const { quantity } = updateCartItemDto;
    return this.cartItemService.updateQuantity(id, quantity);
  }
}
