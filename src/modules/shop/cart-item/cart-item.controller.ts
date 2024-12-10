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
  ApiOkResponse,
  ApiBody,
  ApiOperation,
  ApiParam
} from '@nestjs/swagger';

@ApiTags('Shop Cart')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'UnAuthorized' })
@Auth()
@Controller({
  path: 'cart-item',
  version: '1'
})
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  /**
   * Crear un item en el carrito de compras
   * @summary Crear un item en el carrito de compras
   * @param createCartItemDto Datos del item para el carrito de compras
   * @returns Item del carrito de compras creado
   */
  @Post()
  @ApiOperation({ summary: 'Crear un item en el carrito de compras' })
  @ApiCreatedResponse({ description: 'Artículo del carrito creado' })
  @ApiBody({ type: CreateCartItemDto, description: 'Datos del artículo para el carrito' })
  create(@Body() createCartItemDto: CreateCartItemDto): Promise<HttpResponse<CartItemData>> {
    return this.cartItemService.create(createCartItemDto);
  }

  /**
   * Recupere todos los artículos en el carrito de compras.
   * @returns Una promesa que resuelve una matriz de todos los artículos del carrito.
   */
  @Get()
  @ApiOperation({ summary: 'Recupere todos los artículos en el carrito de compras' })
  @ApiOkResponse({ description: 'Artículos del carrito recuperados' })
  findAll(): Promise<CartItemData[]> {
    return this.cartItemService.findAll();
  }

  /**
   * Elimina un item del carrito de compras.
   * @summary Elimina un item del carrito de compras.
   * @param id Identificador del item del carrito.
   * @returns Mensaje de confirmación de eliminación.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un item del carrito de compras' })
  @ApiOkResponse({ description: 'Artículo del carrito eliminado' })
  @ApiParam({ name: 'id', description: 'Identificador del artículo del carrito' })
  remove(@Param('id') id: string): Promise<HttpResponse<CartItemData>> {
    return this.cartItemService.remove(id);
  }

  /**
   * Actualizar la cantidad de un item en el carrito de compras.
   * @summary Actualizar la cantidad de un item en el carrito de compras.
   * @param id Identificador del item del carrito.
   * @param updateCartItemDto Información para la actualización del item del carrito.
   * @returns Promesa con los datos del item del carrito actualizado.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza la cantidad de un item en el carrito de compras' })
  @ApiOkResponse({ description: 'Artículo del carrito actualizado' })
  @ApiParam({ name: 'id', description: 'Identificador del artículo del carrito' })
  @ApiBody({
    type: UpdateQuantityCartItemDto,
    description: 'Datos para la actualización del artículo del carrito'
  })
  updateQuantity(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateQuantityCartItemDto
  ): Promise<HttpResponse<CartItemData>> {
    const { quantity } = updateCartItemDto;
    return this.cartItemService.updateQuantity(id, quantity);
  }
}
