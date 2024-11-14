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

@ApiTags('Cart')
@Controller({
  path: 'cart',
  version: '1'
})
export class CartController {
  constructor(private readonly cartsService: CartService) {}

  /**
   * Crear un nuevo carrito.
   * Puede ser para un usuario anónimo o autenticado.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo carrito' })
  @ApiResponse({ status: 201, description: 'Carrito creado exitosamente.' })
  async createCart(@Body() createCartDto: CreateCartDto, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.createCart(createCartDto, clientId);
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
  async addItemToCart(
    @Param('id') cartId: string,
    @Body() addCartItemDto: AddCartItemDto,
    @GetClient() client: ClientData
  ) {
    const clientId = client ? client.id : null;
    return this.cartsService.addItemToCart(cartId, addCartItemDto, clientId);
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
    @Body() updateCartItemDto: UpdateCartItemDto,
    @GetClient() client: ClientData
  ) {
    const clientId = client ? client.id : null;
    return this.cartsService.updateCartItem(cartId, itemId, updateCartItemDto, clientId);
  }

  /**
   * Eliminar un ítem del carrito.
   */
  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Eliminar un ítem del carrito' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado correctamente.' })
  async removeCartItem(
    @Param('id') cartId: string,
    @Param('itemId') itemId: string,
    @GetClient() client: ClientData
  ) {
    const clientId = client ? client.id : null;
    return this.cartsService.removeCartItem(cartId, itemId, clientId);
  }
  /**
   * Fusionar dos carritos
   */
  @Post(':id/merge')
  @ApiOperation({ summary: 'Fusionar dos carritos' })
  @ApiResponse({ status: 200, description: 'Carritos fusionados correctamente.' })
  async mergeCarts(@Body() anonCartId: string, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
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
}
