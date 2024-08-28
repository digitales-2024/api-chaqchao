import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateProductVariationDto } from './dto/create-product-variation.dto';
import { UpdateProductVariationDto } from './dto/update-product-variation.dto';
import { ProductsService } from '../products/products.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse, ProductVariationData, UserData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';
import { handleException } from 'src/utils';

@Injectable()
export class ProductVariationService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService
  ) {}
  /**
   * Creacion de la variacion de producto
   * @param createProductVariationDto Data de la variacion del producto
   * @param user Usuario que crea la variacion del producto
   * @returns Variacion de producto creada
   */
  async create(
    createProductVariationDto: CreateProductVariationDto,
    user: UserData
  ): Promise<HttpResponse<ProductVariationData>> {
    try {
      const { additionalPrice, productId } = createProductVariationDto;

      // Validar el producto si se proporciona un productId
      if (productId) {
        const productDB = await this.productsService.findById(productId);

        if (!productDB) {
          throw new BadRequestException('Invalid productId provided');
        }
      }

      // Crear el nuevo producto con el precio convertido
      const newProductVariation = await this.prisma.productVariation.create({
        data: {
          ...createProductVariationDto,
          additionalPrice: parseFloat(additionalPrice.toString())
        },
        select: {
          id: true,
          name: true,
          description: true,
          additionalPrice: true,
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Registrar la auditoría de la creación
      await this.prisma.audit.create({
        data: {
          action: AuditActionType.CREATE,
          entityId: newProductVariation.id,
          entityType: 'productVariation',
          performedById: user.id
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product variation created successfully',
        data: {
          id: newProductVariation.id,
          name: newProductVariation.name,
          description: newProductVariation.description,
          additionalPrice: newProductVariation.additionalPrice,
          product: {
            id: newProductVariation.product.id,
            name: newProductVariation.product.name
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating product variation`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a product variation');
    }
  }

  /**
   * Mostrar todas las variaciones de productos
   * @returns Variacion de Productos activos
   */
  async findAll(): Promise<ProductVariationData[]> {
    try {
      return await this.prisma.productVariation.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          additionalPrice: true,
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Error get all products variation');
      handleException(error, 'Error get all products variation');
    }
  }

  /**
   * Mostrar la variacion del producto buscada por el id
   * @param id Id de la variacion del producto
   * @returns Variacion del Producto
   */
  async findOne(id: string): Promise<ProductVariationData> {
    try {
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error get product variation');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error get product variation');
    }
  }

  /**
   * Mostrar variacion de producto por id
   * @param id Id de la variacion del producto
   * @returns Variacion del producto
   */
  async findById(id: string): Promise<ProductVariationData> {
    const produCtDB = await this.prisma.productVariation.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        additionalPrice: true,
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!produCtDB) {
      throw new BadRequestException('This product variation doesnt exist');
    }
    if (!!produCtDB && !produCtDB.isActive) {
      throw new BadRequestException('This product variation exist, but is inactive');
    }

    return produCtDB;
  }

  async update(
    id: string,
    updateProductVariationDto: UpdateProductVariationDto,
    user: UserData
  ): Promise<HttpResponse<ProductVariationData>> {
    try {
      // Obtener la variación de producto actual desde la base de datos
      const productVariationDB = await this.prisma.productVariation.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          additionalPrice: true,
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!productVariationDB) {
        throw new NotFoundException('Product variation not found');
      }

      // Validar el producto si se proporciona un nuevo productId
      if (updateProductVariationDto.productId) {
        const productDB = await this.productsService.findById(updateProductVariationDto.productId);

        if (!productDB) {
          throw new BadRequestException('Invalid productId provided');
        }
      }

      const { additionalPrice } = updateProductVariationDto;

      const dataToUpdate = {
        ...updateProductVariationDto,
        ...(additionalPrice !== undefined && {
          additionalPrice: parseFloat(additionalPrice.toString())
        })
      };

      // Verificar si hay cambios en los datos
      const hasChanges =
        (updateProductVariationDto.name &&
          updateProductVariationDto.name !== productVariationDB.name) ||
        (updateProductVariationDto.description &&
          updateProductVariationDto.description !== productVariationDB.description) ||
        (additionalPrice !== undefined &&
          parseFloat(additionalPrice.toString()) !== productVariationDB.additionalPrice) ||
        (updateProductVariationDto.productId &&
          updateProductVariationDto.productId !== productVariationDB.product.id);

      if (!hasChanges) {
        return {
          statusCode: HttpStatus.OK,
          message: 'Product variation updated successfully',
          data: {
            id: productVariationDB.id,
            name: productVariationDB.name,
            description: productVariationDB.description,
            additionalPrice: productVariationDB.additionalPrice,
            product: {
              id: productVariationDB.product.id,
              name: productVariationDB.product.name
            }
          }
        };
      }

      // Actualizar los datos de la variación de producto si ha habido cambios
      const updatedProductVariation = await this.prisma.$transaction(async (prisma) => {
        const productVariationUpdate = await prisma.productVariation.update({
          where: { id },
          data: dataToUpdate,
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            additionalPrice: true,
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Registrar la auditoría de la actualización
        await prisma.audit.create({
          data: {
            entityId: productVariationUpdate.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'productVariation'
          }
        });

        return productVariationUpdate;
      });

      // Retornar la respuesta con los datos actualizados
      return {
        statusCode: HttpStatus.OK,
        message: 'Product variation updated successfully',
        data: {
          id: updatedProductVariation.id,
          name: updatedProductVariation.name,
          description: updatedProductVariation.description,
          additionalPrice: updatedProductVariation.additionalPrice,
          product: {
            id: updatedProductVariation.product.id,
            name: updatedProductVariation.product.name
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error updating product variation with id: ${id}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating a product variation');
    }
  }

  /**
   * Eliminar variacion del producto por id
   * @param id Id de la variacion del producto
   * @param user Usuario que elimina la variacion del producto
   * @returns Variacion de Producto eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<ProductVariationData>> {
    try {
      await this.findById(id);

      const productVariationDelete: ProductVariationData =
        await this.prisma.productVariation.delete({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            additionalPrice: true,
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

      await this.prisma.audit.create({
        data: {
          entityId: id,
          action: AuditActionType.DELETE,
          performedById: user.id,
          entityType: 'productVariation'
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product variation deleted',
        data: productVariationDelete
      };
    } catch (error) {
      this.logger.error(`Error deleting product variation by id ${id}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deleting product variation');
    }
  }
}
