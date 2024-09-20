import { Controller, Post, Body, Get } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { Auth } from 'src/modules/admin/auth/decorators';
import { CartData, HttpResponse } from 'src/interfaces';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse
} from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'UnAuthorized' })
@Auth()
@Controller({
  path: 'cart',
  version: '1'
})
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiCreatedResponse({ description: 'Cart Created' })
  @Post()
  create(@Body() createCartDto: CreateCartDto): Promise<HttpResponse<CartData>> {
    return this.cartService.create(createCartDto);
  }

  @ApiOkResponse({ description: 'Get all carts' })
  @Get()
  findAll(): Promise<CartData[]> {
    return this.cartService.findAll();
  }
}
