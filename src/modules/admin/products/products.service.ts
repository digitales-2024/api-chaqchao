import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse, ProductData, UserData, UserPayload } from 'src/interfaces';
import { AuditActionType } from '@prisma/client';
import { handleException } from 'src/utils';
import { CategoryService } from '../category/category.service';
import { ProductVariationService } from '../product-variation/product-variation.service';
import { CreateProductVariationDto } from '../product-variation/dto/create-product-variation.dto';
import { UpdateProductVariationDto } from '../product-variation/dto/update-product-variation.dto';
import { DeleteProductsDto } from './dto/delete-product.dto';
import { CloudflareService } from 'src/modules/cloudflare/cloudflare.service';
import { AdminGateway } from '../admin.gateway';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => ProductVariationService))
    private readonly productVariationService: ProductVariationService,
    private readonly cloudflareService: CloudflareService,
    private readonly adminGateway: AdminGateway
  ) {}

  /**
   * Creacion del producto
   * @param createProductDto Data del producto
   * @param user Usuario que crea el producto
   * @returns Producto Creado
   */
  async create(
    createProductDto: CreateProductDto,
    user: UserData
  ): Promise<HttpResponse<ProductData>> {
    const { name, description, price, image, categoryId, variations, isRestricted } =
      createProductDto;
    let newProduct;

    try {
      // Validar la categoría si se proporciona un categoryId
      if (categoryId) {
        const categoryDB = await this.categoryService.findById(categoryId);
        if (!categoryDB) {
          throw new BadRequestException('Invalid categoryId provided');
        }
      }

      // Crear el producto y registrar la auditoría
      newProduct = await this.prisma.$transaction(async () => {
        // Crear el nuevo producto
        const product = await this.prisma.product.create({
          data: {
            name,
            description,
            price: parseFloat(price.toString()),
            image,
            isRestricted,
            categoryId
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isAvailable: true,
            isRestricted: true,
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Registrar la auditoría de la creación del producto
        await this.prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: product.id,
            entityType: 'product',
            performedById: user.id
          }
        });

        return product;
      });

      // Crear las variaciones del producto
      await this.prisma.$transaction(async () => {
        for (const variation of variations) {
          const createProductVariationDto: CreateProductVariationDto = {
            ...variation,
            productId: newProduct.id,
            description: variation.description || ''
          };
          await this.productVariationService.create(createProductVariationDto, user);
        }
      });

      // Obtener las variaciones creadas para incluirlas en la respuesta
      const createdVariations = await this.prisma.productVariation.findMany({
        where: { productId: newProduct.id },
        select: {
          id: true,
          name: true,
          description: true,
          additionalPrice: true
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
          isAvailable: newProduct.isAvailable,
          isActive: newProduct.isActive,
          isRestricted: newProduct.isRestricted,
          category: {
            id: newProduct.category.id,
            name: newProduct.category.name
          },
          variations: createdVariations
        }
      };
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);

      if (newProduct) {
        await this.prisma.product.delete({ where: { id: newProduct.id } });
        this.logger.error(
          `Product with ID ${newProduct.id} has been deleted due to error in creation.`
        );
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a product');
    }
  }

  /**
   * Mostrar todos los productos
   * @returns Todos los productos
   */
  async findAll(user: UserPayload): Promise<ProductData[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          ...(user.isSuperAdmin ? {} : { isActive: true }) // Filtrar por isActive solo si no es super admin
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isAvailable: true,
          isRestricted: true,
          isActive: true, // Incluir isActive siempre
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              family: true
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
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Mapea los resultados al tipo ProductData
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        isAvailable: product.isAvailable,
        isRestricted: product.isRestricted,
        isActive: product.isActive, // Incluir isActive siempre
        category: product.category,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        variations: product.productVariations
      })) as ProductData[];
    } catch (error) {
      this.logger.error('Error getting all products');
      handleException(error, 'Error getting all products');
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
  /**
   * Actualizar el producto por id
   * @param id Id del producto
   * @param updateProductDto Data del producto
   * @param user Usuario que actualiza el producto
   * @returns Producto actualizado
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: UserData
  ): Promise<HttpResponse<ProductData>> {
    try {
      // Obtener el producto actual desde la base de datos
      const productDB = await this.prisma.product.findUnique({
        where: { id, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isAvailable: true,
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

      if (!productDB) {
        throw new NotFoundException('Product not found');
      }

      // Validar la categoría si se proporciona un nuevo categoryId
      let categoryUpdate = undefined;
      if (updateProductDto.categoryId) {
        const categoryDB = await this.categoryService.findById(updateProductDto.categoryId);
        if (!categoryDB) {
          throw new BadRequestException('Invalid categoryId provided');
        }
        categoryUpdate = { connect: { id: updateProductDto.categoryId } };
      }

      const { price, variationsUpdate } = updateProductDto;

      // Prepare dataToUpdate
      const dataToUpdate = {
        name: updateProductDto.name,
        description: updateProductDto.description,
        price: price !== undefined ? parseFloat(price.toString()) : undefined,
        image: updateProductDto.image,
        category: categoryUpdate
      };

      // Verificar si hay cambios en los datos
      const hasChanges =
        (updateProductDto.name && updateProductDto.name !== productDB.name) ||
        (updateProductDto.description && updateProductDto.description !== productDB.description) ||
        (price !== undefined && parseFloat(price.toString()) !== productDB.price) ||
        (updateProductDto.image && updateProductDto.image !== productDB.image) ||
        (updateProductDto.categoryId && updateProductDto.categoryId !== productDB.category.id);

      // Actualizar el producto y registrar la auditoría
      const updatedProduct = await this.prisma.$transaction(async () => {
        let productUpdate = productDB;

        if (hasChanges) {
          productUpdate = await this.prisma.product.update({
            where: { id },
            data: dataToUpdate,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              isAvailable: true,
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

          // Registrar la auditoría de la actualización del producto
          await this.prisma.audit.create({
            data: {
              entityId: productUpdate.id,
              action: AuditActionType.UPDATE,
              performedById: user.id,
              entityType: 'product'
            }
          });
        }

        return productUpdate;
      });

      // Manejar las variaciones
      await this.prisma.$transaction(async () => {
        // Obtener las variaciones actuales
        const existingVariations = productDB.productVariations;

        // Identificar variaciones a eliminar
        const updatedVariationNames = variationsUpdate
          ? variationsUpdate.filter((v) => v.name).map((v) => v.name)
          : [];
        const variationIdsToRemove = existingVariations
          .filter((v) => !updatedVariationNames.includes(v.name))
          .map((v) => v.id);

        // Eliminar variaciones que ya no están presentes
        await Promise.all(
          variationIdsToRemove.map((id) => this.productVariationService.remove(id, user))
        );

        // Actualizar o crear variaciones
        for (const variation of variationsUpdate || []) {
          const existingVariation = existingVariations.find((v) => v.name === variation.name);
          if (existingVariation) {
            // Actualizar variación existente
            const updateVariationDto: UpdateProductVariationDto = {
              ...variation,
              description: variation.description || '',
              additionalPrice: variation.additionalPrice // Asegúrate de incluir este campo
            };
            await this.productVariationService.update(
              existingVariation.id,
              updateVariationDto,
              user
            );
          } else if (variation.name) {
            // Crear nueva variación solo si `name` está presente
            const createVariationDto: CreateProductVariationDto = {
              ...variation,
              productId: updatedProduct.id,
              description: variation.description || '',
              name: variation.name,
              additionalPrice: variation.additionalPrice
            };
            await this.productVariationService.create(createVariationDto, user);
          }
        }
      });

      // Recargar el producto actualizado
      const finalUpdatedProduct = await this.prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isAvailable: true,
          isActive: true,
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

      // Retornar la respuesta con los datos actualizados
      return {
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: {
          id: finalUpdatedProduct.id,
          name: finalUpdatedProduct.name,
          description: finalUpdatedProduct.description,
          price: finalUpdatedProduct.price,
          image: finalUpdatedProduct.image,
          isAvailable: finalUpdatedProduct.isAvailable,
          isActive: finalUpdatedProduct.isActive,
          isRestricted: finalUpdatedProduct.isRestricted,
          category: {
            id: finalUpdatedProduct.category.id,
            name: finalUpdatedProduct.category.name
          },
          variations: finalUpdatedProduct.productVariations
        }
      };
    } catch (error) {
      this.logger.error(`Error updating product with id: ${id}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error updating a product');
    }
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
   * @returns Producto desactivado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<ProductData>> {
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
        await prisma.audit.create({
          data: {
            entityId: productDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'product'
          }
        });

        // Retornar la estructura deseada, incluyendo variaciones
        return {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          image: productDB.image,
          isAvailable: productDB.isAvailable,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          category: {
            id: productDB.category.id,
            name: productDB.category.name
          },
          variations: productDB.variations
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
   * Desactivar todos los productos en la base de datos
   * @param products Productos a desactivar
   * @param user Usuario que desactiva los productos
   * @returns Productos desactivados
   */
  async removeAll(
    products: DeleteProductsDto,
    user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los productos en la base de datos
        const productsDB = await prisma.product.findMany({
          where: {
            id: { in: products.ids }
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isAvailable: true,
            isActive: true,
            // Incluir la categoría relacionada
            category: {
              select: {
                id: true,
                name: true
              }
            },
            // Incluir todas las variaciones asociadas al producto
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

        // Validar que se encontraron los productos
        if (productsDB.length === 0) {
          throw new NotFoundException('Products not found or inactive');
        }

        const deactivatePromises = productsDB.map(async (productDelete) => {
          // Desactivar productos
          await prisma.product.update({
            where: { id: productDelete.id },
            data: { isActive: false }
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.DELETE,
              entityId: productDelete.id,
              entityType: 'product',
              performedById: user.id,
              createdAt: new Date()
            }
          });

          return {
            id: productDelete.id,
            name: productDelete.name,
            description: productDelete.description,
            price: productDelete.price,
            image: productDelete.image,
            isAvailable: productDelete.isAvailable,
            isActive: productDelete.isActive,
            category: {
              id: productDelete.category.id,
              name: productDelete.category.name
            },
            variations: productDelete.productVariations
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products deactivate successfully'
      };
    } catch (error) {
      this.logger.error('Error deactivating products', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deactivating products');
    }
  }

  /**
   * Mostrar producto por id
   * @param id Id del producto
   * @returns Si existe el producto te retorna el mensaje de error si no te retorna el producto
   */
  async findById(id: string): Promise<ProductData> {
    const productDB = await this.prisma.product.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        price: true,
        image: true,
        isAvailable: true,
        isRestricted: true,
        // Incluir la categoría relacionada
        category: {
          select: {
            id: true,
            name: true
          }
        },
        // Incluir todas las variaciones asociadas al producto
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

    // Verificar si el producto existe y está activo
    if (!productDB) {
      throw new BadRequestException('This product does not exist');
    }
    if (!!productDB && !productDB.isActive) {
      throw new BadRequestException('This product exists, but is inactive');
    }

    // Mapeo al tipo ProductData
    return {
      id: productDB.id,
      name: productDB.name,
      description: productDB.description,
      price: productDB.price,
      image: productDB.image,
      isAvailable: productDB.isAvailable,
      isActive: productDB.isActive,
      isRestricted: productDB.isRestricted,
      category: productDB.category,
      variations: productDB.productVariations
    };
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
        // Obtener el producto actual, incluyendo todas las propiedades necesarias
        const productDB = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isAvailable: true,
            isActive: true,
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

        if (!productDB) {
          throw new BadRequestException('Product not found');
        }

        // Determinar la nueva acción basada en el estado actual de isAvailable
        const newStatus = !productDB.isAvailable;
        const action = newStatus ? 'activated' : 'deactivated';

        // Actualizar el estado de isAvailable del producto
        await prisma.product.update({
          where: { id },
          data: {
            isAvailable: newStatus
          }
        });

        // Enviar notificación a los clientes mediante websockets
        this.adminGateway.sendProductAvailabilityUpdated(id, newStatus);

        // Crear un registro de auditoría
        await prisma.audit.create({
          data: {
            entityId: productDB.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'product'
          }
        });

        // Retornar la estructura de ProductData incluyendo variaciones
        const productData: ProductData = {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          image: productDB.image,
          isAvailable: newStatus,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          category: {
            id: productDB.category.id,
            name: productDB.category.name
          },
          variations: productDB.productVariations.map((variation) => ({
            id: variation.id,
            name: variation.name,
            description: variation.description,
            additionalPrice: variation.additionalPrice
          }))
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

  /**
   * Reactivar un producto por id
   * @param id Id del producto
   * @param user Usuario que reactiva el producto
   * @returns Producto reactivado
   */
  async reactivate(id: string, user: UserData): Promise<HttpResponse<ProductData>> {
    try {
      const productReactivate = await this.prisma.$transaction(async (prisma) => {
        const productDB = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            price: true,
            image: true,
            isAvailable: true,
            isRestricted: true,
            // Incluir la categoría relacionada
            category: {
              select: {
                id: true,
                name: true
              }
            },
            // Incluir todas las variaciones asociadas al producto
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

        if (!productDB) {
          throw new NotFoundException('Product not found');
        }

        if (productDB.isActive) {
          throw new BadRequestException('Product is already active');
        }

        await prisma.product.update({
          where: { id },
          data: {
            isActive: true
          }
        });

        await this.prisma.audit.create({
          data: {
            action: AuditActionType.UPDATE,
            entityId: productDB.id,
            entityType: 'product',
            performedById: user.id,
            createdAt: new Date()
          }
        });
        return {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          image: productDB.image,
          isAvailable: productDB.isAvailable,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          category: {
            id: productDB.category.id,
            name: productDB.category.name
          },
          variations: productDB.productVariations
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product reactivated',
        data: productReactivate
      };
    } catch (error) {
      this.logger.error(`Error reactivating a product for id: ${id}`, error.stack);
      handleException(error, 'Error reactivating a product');
    }
  }

  /**
   * Activar todos los productos en la base de datos
   * @param user Usuario que reactiva los productos
   * @param products Productos a reactivar
   * @returns Productos reactivados
   */
  async reactivateAll(
    user: UserData,
    products: DeleteProductsDto
  ): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los productos en la base de datos
        const productsDB = await prisma.product.findMany({
          where: {
            id: { in: products.ids }
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            isAvailable: true,
            isActive: true,
            // Incluir la categoría relacionada
            category: {
              select: {
                id: true,
                name: true
              }
            },
            // Incluir todas las variaciones asociadas al producto
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

        // Validar que se encontraron los productos
        if (productsDB.length === 0) {
          throw new NotFoundException('Product not found or inactive');
        }

        // Reactivar productos
        const reactivatePromises = productsDB.map(async (product) => {
          // Activar el producto
          await prisma.product.update({
            where: { id: product.id },
            data: { isActive: true }
          });

          await this.prisma.audit.create({
            data: {
              action: AuditActionType.UPDATE,
              entityId: product.id,
              entityType: 'product',
              performedById: user.id,
              createdAt: new Date()
            }
          });

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            isAvailable: product.isAvailable,
            isActive: product.isActive,
            category: {
              id: product.category.id,
              name: product.category.name
            },
            variations: product.productVariations
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products reactivate successfully'
      };
    } catch (error) {
      this.logger.error('Error reactivating products', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error reactivating products');
    }
  }
  /**
   * Subir imagen
   * @param image Imagen a subir
   * @returns URL de la imagen
   */
  async uploadImage(image: Express.Multer.File): Promise<HttpResponse<string>> {
    let imageUrl: string = null;

    try {
      if (!image) {
        throw new BadRequestException('Image not provided');
      }

      // Validar que solo se suba un archivo
      if (Array.isArray(image)) {
        throw new BadRequestException('Only one file can be uploaded at a time');
      }

      // Validar que el archivo sea una imagen
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(image.mimetype)) {
        throw new BadRequestException(
          'The file must be an image in JPEG, PNG, GIF, or WEBP format'
        );
      }

      // Sube la imagen y devuelve la URL
      imageUrl = await this.cloudflareService.uploadImage(image);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Image uploaded successfully',
        data: imageUrl
      };
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error subiendo la imagen');
    }
  }

  /**
   * Actualizar imagen
   * @param image Imagen a actualizar
   * @param existingFileName Nombre del archivo existente
   * @returns URL de la imagen actualizada
   */
  async updateImage(
    image: Express.Multer.File,
    existingFileName: string
  ): Promise<HttpResponse<string>> {
    let imageUrl: string = null;

    try {
      if (!image) {
        throw new BadRequestException('Image not provided');
      }

      // Validar que solo se suba un archivo
      if (Array.isArray(image)) {
        throw new BadRequestException('Only one file can be uploaded at a time');
      }

      // Validar que el archivo sea una imagen
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(image.mimetype)) {
        throw new BadRequestException(
          'The file must be an image in JPEG, PNG, GIF, or WEBP format'
        );
      }

      // Actualizar la imagen y devuelve la URL
      imageUrl = await this.cloudflareService.updateImage(image, existingFileName);
      return {
        statusCode: HttpStatus.OK,
        message: 'Image updated successfully',
        data: imageUrl
      };
    } catch (error) {
      this.logger.error(`Error updating image: ${error.message}`, error.stack);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error updating image');
    }
  }
}
