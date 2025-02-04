import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCategoryDto } from './dto/get-category.dto';
import { CategoryData, ProductData } from 'src/interfaces';
import { handleException } from 'src/utils';
import { GetProductDto } from './dto/get-products.dto';
import { Family } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene todas las categorías activas.
   * @returns Lista de categorías activas.
   * @throws Error - Si no hay categorías activas.
   */
  async getAllCategories(): Promise<CategoryData[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        family: true
      }
    });

    if (!categories) {
      throw new Error('No active categories found');
    }

    return categories;
  }

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
   * Obtiene los productos activos y disponibles en base a un filtro.
   * @param filter - Filtro opcional para buscar por nombre, precio máximo, precio mínimo y nombre de categoría.
   * @returns Lista de productos activos y disponibles.
   */
  async getFilteredProducts(filter: GetProductDto): Promise<ProductData[]> {
    const whereConditions: any = {
      isActive: true // Productos activos
    };

    if (filter.name) {
      whereConditions.name = {
        contains: filter.name,
        mode: 'insensitive'
      };
    }

    if (filter.priceMax !== undefined && filter.priceMin !== undefined) {
      whereConditions.price = {
        gte: filter.priceMin,
        lte: filter.priceMax
      };
    }

    if (filter.categoryName) {
      whereConditions.category = {
        name: {
          contains: filter.categoryName,
          mode: 'insensitive'
        }
      };
    }

    // Consulta para obtener productos activos y disponibles
    const products = await this.prisma.product.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        isActive: true,
        isAvailable: true,
        isRestricted: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        productVariations: {
          select: {
            id: true,
            name: true,
            description: true,
            additionalPrice: true
          }
        }
      }
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      isRestricted: product.isRestricted,
      category: {
        id: product.category.id,
        name: product.category.name
      },
      variations: product.productVariations.map((variation) => ({
        id: variation.id,
        name: variation.name,
        description: variation.description,
        additionalPrice: variation.additionalPrice
      }))
    }));
  }

  /**
   * Obtiene los productos de la categoría Merch.
   * @returns Lista de productos de la categoría Merch.
   */
  async getMerch(): Promise<ProductData[]> {
    const merchProducts = await this.prisma.product.findMany({
      where: {
        category: {
          family: Family.MERCH
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        isActive: true,
        isAvailable: true,
        isRestricted: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        productVariations: {
          select: {
            id: true,
            name: true,
            description: true,
            additionalPrice: true
          }
        }
      }
    });

    return merchProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      isRestricted: product.isRestricted,
      category: {
        id: product.category.id,
        name: product.category.name
      },
      variations: product.productVariations.map((variation) => ({
        id: variation.id,
        name: variation.name,
        description: variation.description,
        additionalPrice: variation.additionalPrice
      }))
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

  /**
   * Obtienes los productos recomendados para un usuario en base a sus preferencias o historial de compras anteriores.
   * @param id - Id del cliente.
   * @returns Lista de productos recomendados.
   * @throws Error - Si no hay productos recomendados.
   */
  async getRecommendedProductsByClient(id: string): Promise<ProductData[]> {
    try {
      const purchasedCategories = await this.prisma.order.findMany({
        where: {
          cart: {
            clientId: id
          }
        },
        select: {
          cart: {
            select: {
              cartItems: {
                select: {
                  product: {
                    select: {
                      categoryId: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      const categoryIds = purchasedCategories
        .flatMap((order) => order.cart.cartItems.map((item) => item.product.categoryId))
        .filter((value, index, self) => self.indexOf(value) === index);
      // Obtener productos en esas categorías excluyendo los ya comprados
      const recommendations = await this.prisma.product.findMany({
        where: {
          categoryId: {
            in: categoryIds
          },
          category: {
            family: {
              not: Family.MERCH
            }
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isActive: true,
          isAvailable: true,
          isRestricted: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          productVariations: {
            select: {
              id: true,
              name: true,
              description: true,
              additionalPrice: true
            }
          }
        },
        take: 4 // Limitar el número de recomendaciones
      });

      return recommendations.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isActive: product.isActive,
        isAvailable: product.isAvailable,
        isRestricted: product.isRestricted,
        category: {
          id: product.category.id,
          name: product.category.name
        },
        variations: product.productVariations.map((variation) => ({
          id: variation.id,
          name: variation.name,
          description: variation.description,
          additionalPrice: variation.additionalPrice
        }))
      }));
    } catch (error) {
      this.logger.error(`Error getting recommended products for client ${id}: ${error.message}`);
      handleException(error, 'Error getting recommended products');
    }
  }

  /**
   * Obtiene los productos recomendados para todos los clientes.
   * @returns Lista de productos recomendados.
   * @throws Error - Si no hay productos recomendados.
   */
  async getRecommendedProducts(): Promise<ProductData[]> {
    try {
      // Obtener productos recomendados
      const recommendations = await this.prisma.product.findMany({
        where: {
          isActive: true,
          category: {
            family: {
              not: Family.MERCH
            }
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isActive: true,
          isAvailable: true,
          isRestricted: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          productVariations: {
            select: {
              id: true,
              name: true,
              description: true,
              additionalPrice: true
            }
          },
          cartItems: {
            include: {
              cart: true
            }
          }
        },
        orderBy: {
          cartItems: {
            _count: 'desc'
          }
        },
        take: 8 // Limitar el número de recomendaciones
      });

      return recommendations.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isActive: product.isActive,
        isAvailable: product.isAvailable,
        isRestricted: product.isRestricted,
        categoryId: product.category.id,
        category: {
          id: product.category.id,
          name: product.category.name
        },
        variations: product.productVariations.map((variation) => ({
          id: variation.id,
          name: variation.name,
          description: variation.description,
          additionalPrice: variation.additionalPrice
        }))
      }));
    } catch (error) {
      this.logger.error(`Error getting recommended products: ${error.message}`);
      handleException(error, 'Error getting recommended products');
    }
  }

  /**
   * Obtiene los productos de una categoría específica por su id.
   * @param id - Id de la categoría.
   * @returns Lista de productos de la categoría.
   */
  async getProductCategoryById(id: string): Promise<ProductData[]> {
    const category = await this.prisma.category.findUnique({
      where: {
        id
      },
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
            isAvailable: true,
            isRestricted: true
          }
        }
      }
    });

    return category.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      isRestricted: product.isRestricted,
      category: {
        id: category.id,
        name: category.name
      },
      variations: []
    }));
  }
}
