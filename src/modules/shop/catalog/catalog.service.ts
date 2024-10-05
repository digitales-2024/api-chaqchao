import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCategoryDto } from './dto/get-category.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene las categorías activas que tienen al menos un producto activo y disponible.
   *
   * @param filter - Filtro opcional para buscar por nombre de categoría.
   * @returns Lista de categorías activas con la cantidad de productos activos y disponibles en cada una.
   */
  async getFilteredCategory(filter: GetCategoryDto): Promise<any> {
    const whereConditions: any = {
      isActive: true, // Categorías activas
      products: {
        some: {
          isActive: true,
          isAvailable: true
        }
      }
    };

    if (filter.name) {
      whereConditions.name = {
        contains: filter.name,
        mode: 'insensitive'
      };
    }

    // Consulta para obtener categorías con productos activos y disponibles
    const categories = await this.prisma.category.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        products: {
          where: {
            isActive: true,
            isAvailable: true
          }
        }
      }
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      quantityProduct: category.products.length
    }));
  }

  /**
   * Obtiene las categorías activas junto con los nombres de los productos activos y disponibles.
   *
   * @param filter - Filtro opcional para buscar por nombre de categoría.
   * @returns Lista de categorías activas con los nombres de los productos activos y disponibles.
   */
  async getFilteredProductCategory(filter: GetCategoryDto): Promise<any> {
    const whereConditions: any = {
      isActive: true // Categorías activas
    };

    if (filter.name) {
      whereConditions.name = {
        contains: filter.name,
        mode: 'insensitive'
      };
    }

    // Consulta para obtener categorías con productos activos y disponibles
    const categories = await this.prisma.category.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isActive: true,
            isRestricted: true,
            isAvailable: true
          },
          where: {
            isActive: true,
            isAvailable: true
          }
        }
      }
    });

    return categories.map((productCategory) => ({
      id: productCategory.id,
      name: productCategory.name,
      quantityProduct: productCategory.products.length,
      products: productCategory.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isActive: product.isActive,
        isAvailable: product.isAvailable,
        isRestricted: product.isRestricted
      }))
    }));
  }
}
