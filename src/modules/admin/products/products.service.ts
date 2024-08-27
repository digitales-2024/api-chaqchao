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

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product${updateProductDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
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

        if (!productDB.isActive) {
          throw new BadRequestException('Product is already deactivated');
        }

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
}
