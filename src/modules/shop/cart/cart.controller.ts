import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { ClientData, HttpResponse, ProductData } from 'src/interfaces';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CartDto } from './dto/cart.dto';
import { ClientAuth } from '../auth/decorators/client-auth.decorator';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetClient } from '../auth/decorators/get-client.decorator';
import { DeleteItemDto } from './dto/delete-item';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('Shop Cart')
@Controller({
  path: 'cart',
  version: '1'
})
export class CartController {
  constructor(private readonly cartsService: CartService) {}

  /**
   * Verifica si el cliente tiene un carrito activo.
   * Si el cliente está autenticado, utiliza su ID para la verificación.
   * @param client Los datos del cliente autenticado.
   * @returns Un booleano que indica si el cliente tiene un carrito activo.
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
   * @param createCartDto Los datos para crear el carrito.
   * @returns Un objeto con el ID del carrito creado.
   */
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo carrito' })
  @ApiResponse({ status: 201, description: 'Carrito creado exitosamente.' })
  @ApiBody({ type: CreateCartDto, description: 'Datos para crear el carrito' })
  async createCart(@Body() createCartDto: CreateCartDto) {
    return this.cartsService.createCart(createCartDto);
  }

  /**
   * Obtener un carrito por su ID.
   * Si el cliente está autenticado, se verifica que el carrito pertenezca al cliente.
   * @param id El ID del carrito.
   * @param client Los datos del cliente autenticado.
   * @returns El carrito con sus ítems asociados.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un carrito por ID' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  @ClientAuth()
  async getCartById(@Param('id') id: string, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.getCartById(id, clientId);
  }

  /**
   * Agregar un ítem al carrito.
   * @param cartId El ID del carrito.
   * @param addCartItemDto Los datos del ítem a agregar al carrito.
   * @returns Una promesa que se resuelve cuando el ítem se ha agregado correctamente.
   */
  @Post(':id/items')
  @ApiOperation({ summary: 'Agregar un ítem al carrito' })
  @ApiResponse({ status: 201, description: 'Ítem agregado correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  @ApiBody({ type: AddCartItemDto, description: 'Datos del ítem a agregar al carrito' })
  async addItemToCart(@Param('id') cartId: string, @Body() addCartItemDto: AddCartItemDto) {
    return this.cartsService.addItemToCart(cartId, addCartItemDto);
  }

  /**
   * Actualizar un ítem en el carrito.
   * @param cartId El ID del carrito.
   * @param itemId El ID del ítem en el carrito.
   * @param updateCartItemDto Los datos para actualizar el ítem.
   * @returns Una promesa que se resuelve cuando el ítem se ha actualizado correctamente.
   */
  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Actualizar un ítem en el carrito' })
  @ApiResponse({ status: 200, description: 'Ítem actualizado correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  @ApiParam({ name: 'itemId', type: String, description: 'ID del ítem' })
  @ApiBody({ type: UpdateCartItemDto, description: 'Datos para actualizar el ítem' })
  async updateCartItem(
    @Param('id') cartId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.cartsService.updateCartItem(cartId, itemId, updateCartItemDto);
  }

  /**
   * Eliminar un ítem del carrito.
   * @param cartId El ID del carrito.
   * @param itemId El ID del ítem en el carrito.
   * @param client El ID del cliente autenticado (opcional).
   * @returns Una promesa que se resuelve cuando el ítem se ha eliminado correctamente.
   */
  @Delete(':id/items/:itemId/delete')
  @ApiOperation({ summary: 'Eliminar un ítem del carrito' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  @ApiParam({ name: 'itemId', type: String, description: 'ID del ítem' })
  @ApiBody({ type: DeleteItemDto, description: 'ID del cliente autenticado (opcional)' })
  async removeCartItem(
    @Param('id') cartId: string,
    @Param('itemId') itemId: string,
    @Body() client: DeleteItemDto
  ) {
    return this.cartsService.removeCartItem(cartId, itemId, client);
  }

  /**
   * Fusionar un carrito anónimo con el carrito asociado al cliente autenticado.
   * @param anonCartId El ID del carrito anónimo.
   * @param clientId El ID del cliente autenticado (opcional).
   * @returns Una promesa que se resuelve cuando los carritos se han fusionado correctamente.
   */
  @Post(':id/merge')
  @ApiOperation({ summary: 'Fusionar dos carritos' })
  @ApiResponse({ status: 200, description: 'Carritos fusionados correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito anónimo' })
  @ApiBody({ type: String, description: 'ID del cliente autenticado (opcional)' })
  async mergeCarts(@Param('id') anonCartId: string, @Body() clientId?: string) {
    return this.cartsService.mergeCarts(anonCartId, clientId);
  }

  /**
   * Completar la compra del carrito y crear una orden.
   * @param cartId El ID del carrito.
   * @param createOrderDto Datos para crear la orden.
   * @returns Una promesa que se resuelve cuando la compra se ha completado exitosamente.
   */
  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar la compra del carrito' })
  @ApiResponse({ status: 201, description: 'Compra completada exitosamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  @ApiBody({ type: CreateOrderDto, description: 'Datos para crear la orden' })
  async completeCart(@Param('id') cartId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.cartsService.completeCart(cartId, createOrderDto);
  }

  /**
   * Actualizar el pedido con el pago realizado.
   * @param invoice Datos de la factura.
   * @param orderId El ID de la orden.
   * @returns Una promesa que se resuelve cuando el pago se ha realizado correctamente.
   */
  @Post(':id/checkout')
  @ApiOperation({ summary: 'Actualizar el pedido con el pago realizado' })
  @ApiResponse({ status: 200, description: 'Pago realizado correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del pedido' })
  @ApiBody({ type: CreateInvoiceDto, description: 'Datos de la factura' })
  async checkoutCart(@Body() invoice: CreateInvoiceDto, @Param('id') orderId: string) {
    return this.cartsService.checkoutCart(orderId, invoice);
  }

  /**
   * Eliminar un carrito.
   * @param cartId ID del carrito.
   * @param client Datos del cliente autenticado.
   * @returns Una promesa que se resuelve cuando el carrito ha sido eliminado correctamente.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un carrito' })
  @ApiResponse({ status: 200, description: 'Carrito eliminado correctamente.' })
  @ApiParam({ name: 'id', type: String, description: 'ID del carrito' })
  async deleteCart(@Param('id') cartId: string, @GetClient() client: ClientData) {
    const clientId = client ? client.id : null;
    return this.cartsService.deleteCart(cartId, clientId);
  }

  /**
   * Verificar que todos los productos de un carrito estén disponibles
   * @param cart Carrito con los productos a verificar
   * @returns Si todos los productos están disponibles, una respuesta vacía.
   *          Si no todos los productos están disponibles, una respuesta con un array
   *          de productos que no están disponibles.
   */
  @Post('/validate')
  @ApiOperation({ summary: 'Validar la disponibilidad de los productos de un carrito' })
  @ApiResponse({ status: 200, description: 'Productos disponibles' })
  @ApiResponse({ status: 400, description: 'Productos no disponibles' })
  @ApiBody({ type: CartDto, description: 'Carrito con los productos a verificar' })
  async checkout(@Body() cart: CartDto): Promise<HttpResponse<ProductData[]>> {
    return this.cartsService.validateCartItems(cart);
  }

  /**
   * Buscar carrito por tempId.
   * @param tempId Temporal ID del carrito.
   * @returns Carrito encontrado.
   */
  @Post('temp/:tempId')
  @ApiOperation({ summary: 'Buscar carrito por tempId' })
  @ApiResponse({ status: 200, description: 'Carrito encontrado' })
  @ApiParam({ name: 'tempId', type: String, description: 'Temporal ID del carrito' })
  async getCartByTempId(@Param('tempId') tempId: string) {
    return this.cartsService.getCartByTempId(tempId);
  }
}
