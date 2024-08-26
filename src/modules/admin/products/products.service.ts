import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse, ProductData, UserData } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';

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
          price: parseFloat(price.toString()),
          categoryId: '714924ea-4852-463c-8f09-9175591dbc5e'
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
}
