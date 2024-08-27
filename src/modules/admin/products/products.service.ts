import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse, ProductData, UserData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
    user: UserData
  ): Promise<HttpResponse<ProductData>> {
    try {
      const { price } = createProductDto;

      const newProduct = await this.prisma.product.create({
        data: {
          ...createProductDto,
          price: parseFloat(price.toString())
        }
      });

      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: newProduct.id,
          entityType: 'product',
          performedById: user.id
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          image: newProduct.image,
          category: { id: newProduct.categoryId, name: 'Category name' }
        }
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Mostrar todos los productos
   * @returns Todos los productos
   */
  async findAll(): Promise<ProductData[]> {
    try {
      return await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          price: true,
          image: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error get all products');
      handleException(error, 'Error get all products');
    }
  }

  /**
   * Mostrar producto por id
   * @param id Id del producto
   * @returns Informacion del Producto
   */
  async findOne(id: string): Promise<ProductData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get product');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get product');
    }
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product${updateProductDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  /**
   * Mostrar productos por id categoria
   * @param id Id de Categoria
   * @returns Productos asignados a la categoria
   */
  async findProductsByIdCategory(id: string) {
    return await this.prisma.product.findMany({
      where: { categoryId: id },
      select: { id: true, name: true, description: true, isActive: true }
    });
  }

  /**
   * Desactivar producto
   * @param id Id del producto
   * @param user Usuario que desactiva el producto
   * @returns Producto desactivada
   */
  async desactivate(id: string, user: UserData): Promise<HttpResponse<ProductData>> {
    try {
      const productDesactivate = await this.prisma.$transaction(async (prisma) => {
        const productDB = await this.findById(id);

        // Actualizar el estado del producto
        await prisma.product.update({
          where: { id },
          data: {
            isActive: false
          }
        });

        // Crear un registro de auditoría
        await this.prisma.audit.create({
          data: {
            entityId: productDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'product'
          }
        });

        // Retornar la estructura deseada
        return {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          image: productDB.image,
          category: {
            id: productDB.category.id,
            name: productDB.category.name
          }
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product deactivated successfully',
        data: productDesactivate
      };
    } catch (error) {
      this.logger.error(`Error deactivating a product for id: ${id}`, error.stack);
      handleException(error, 'Error deactivating a product');
    }
  }

  /**
   * Mostrar producto por id
   * @param id Id del producto
   * @returns Si existe el producto te retorna el mensaje de error si no te retorna el producto
   */
  async findById(id: string): Promise<ProductData> {
    const produCtDB = await this.prisma.product.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        price: true,
        image: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!produCtDB) {
      throw new BadRequestException('This product doesnt exist');
    }
    if (!!produCtDB && !produCtDB.isActive) {
      throw new BadRequestException('This product exist, but is inactive');
    }

    return produCtDB;
  }
  /**
   * Activar o desactivar los productos por id
   * @param id Id del Producto
   * @param user Usuario que cambia el estado
   * @returns Producto desactivado o activado
   */
  async toggleActivation(id: string, user: UserData): Promise<HttpResponse<ProductData>> {
    try {
      const toggledProduct = await this.prisma.$transaction(async (prisma) => {
        // Obtener el producto actual, incluyendo isActive para la lógica de activación/desactivación
        const productDB = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            price: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        if (!productDB) {
          throw new NotFoundException('Product not found');
        }

        // Determinar la nueva acción basada en el estado actual de isActive
        const newStatus = !productDB.isActive;
        const action = newStatus ? 'activated' : 'desactivated';

        // Actualizar el estado de isActive del producto
        await prisma.product.update({
          where: { id },
          data: {
            isActive: newStatus
          }
        });

        // Crear un registro de auditoría
        await this.prisma.audit.create({
          data: {
            entityId: productDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'product'
          }
        });

        // Retornar la estructura de ProductData sin incluir isActive
        const productData: ProductData = {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          image: productDB.image,
          category: {
            id: productDB.category.id,
            name: productDB.category.name
          }
        };

        return { productData, action };
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Product successfully ${toggledProduct.action}`,
        data: toggledProduct.productData
      };
    } catch (error) {
      this.logger.error(`Error toggling activation for product with id: ${id}`, error.stack);
      handleException(error, 'Error toggling product activation');
    }
  }
}
