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

  findOne(id: number) {
    return `This action returns a #${id} productVariation`;
  }

  update(id: number, updateProductVariationDto: UpdateProductVariationDto) {
    return `This action updates a #${id} ${updateProductVariationDto} productVariation`;
  }

  remove(id: number) {
    return `This action removes a #${id} productVariation`;
  }
}
