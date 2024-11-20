import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ClientData, HttpResponse, ProductData } from 'src/interfaces';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartDto } from './dto/cart.dto';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetClient } from '../auth/decorators/get-client.decorator';
import { DeleteItemDto } from './dto/delete-item';
import { CartDataComplet } from 'src/interfaces/cart.interface';

@ApiTags('Shop Cart')
@Controller({
  path: 'cart',
  version: '1'
})
export class CartController {
  constructor(private readonly cartsService: CartService) {}

  /**
   * Verificar que el cliente tenga un carrito activo.
   * Si no lo tiene, se crea uno.
   * Si el cliente es anónimo, se crea un carrito anónimo.
   */
  @Get('check')
  @ApiOperation({ summary: 'Verificar carrito activo del cliente' })
  @ApiResponse({ status: 200, description: 'Carrito verificado correctamente.' })
  async checkCart(@GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.checkCart(clientId);
  }

  /**
   * Crear un nuevo carrito.
   * Puede ser para un usuario anónimo o autenticado.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo carrito' })
  @ApiResponse({ status: 201, description: 'Carrito creado exitosamente.' })
  async createCart(@Body() createCartDto: CreateCartDto) {
    return this.cartsService.createCart(createCartDto);
  }

  /**
   * Obtener un carrito por su ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un carrito por ID' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido correctamente.' })
  @ClientAuth()
  async getCartById(@Param('id') id: string, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.getCartById(id, clientId);
  }

  /**
   * Agregar un ítem al carrito.
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Agregar un ítem al carrito' })
  @ApiResponse({ status: 201, description: 'Ítem agregado correctamente.' })
  async addItemToCart(@Param('id') cartId: string, @Body() addCartItemDto: AddCartItemDto) {
    return this.cartsService.addItemToCart(cartId, addCartItemDto);
  }

  /**
   * Actualizar la cantidad de un ítem en el carrito.
   */
  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Actualizar un ítem en el carrito' })
  @ApiResponse({ status: 200, description: 'Ítem actualizado correctamente.' })
  async updateCartItem(
    @Param('id') cartId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.cartsService.updateCartItem(cartId, itemId, updateCartItemDto);
  }

  /**
   * Eliminar un ítem del carrito.
   */
  @Delete(':id/items/:itemId/delete')
  @ApiOperation({ summary: 'Eliminar un ítem del carrito' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado correctamente.' })
  async removeCartItem(
    @Param('id') cartId: string,
    @Param('itemId') itemId: string,
    @Body() client: DeleteItemDto
  ) {
    return this.cartsService.removeCartItem(cartId, itemId, client);
  }
  /**
   * Fusionar dos carritos
   */
  @Post(':id/merge')
  @ApiOperation({ summary: 'Fusionar dos carritos' })
  @ApiResponse({ status: 200, description: 'Carritos fusionados correctamente.' })
  async mergeCarts(@Param('id') anonCartId: string, @Body() clientId?: string) {
    return this.cartsService.mergeCarts(anonCartId, clientId);
  }

  /**
   * Completar la compra del carrito y crear una orden.
   */
  @Post(':id/checkout')
  @ApiOperation({ summary: 'Completar la compra del carrito' })
  @ApiResponse({ status: 201, description: 'Compra completada exitosamente.' })
  @ClientAuth()
  async completeCart(
    @Param('id') cartId: string,
    @Body() createOrderDto: CreateOrderDto,
    @GetClient() client: ClientData
  ) {
    const clientId = client ? client.id : null;
    return this.cartsService.completeCart(cartId, createOrderDto, clientId);
  }

  /**
   * Eliminar un carrito.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un carrito' })
  @ApiResponse({ status: 200, description: 'Carrito eliminado correctamente.' })
  async deleteCart(@Param('id') cartId: string, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.deleteCart(cartId, clientId);
  }

  /**
   * Validar los items del carrito
   */
  @Post('/validate')
  @ApiOperation({ summary: 'Validar la disponibilidad de los productos de un carrito' })
  @ApiResponse({ status: 200, description: 'Productos disponibles' })
  async checkout(@Body() cart: CartDto): Promise<HttpResponse<ProductData[]>> {
    return this.cartsService.validateCartItems(cart);
  }

  /**
   * Buscar el carrito por tempId
   */
  @Post('temp/:tempId')
  @ApiOperation({ summary: 'Buscar carrito por tempId' })
  @ApiResponse({ status: 200, description: 'Carrito encontrado' })
  async getCartByTempId(@Param('tempId') tempId: string): Promise<HttpResponse<CartDataComplet>> {
    return this.cartsService.getCartByTempId(tempId);
  }
}
