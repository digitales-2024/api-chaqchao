import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { AuditActionType } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { HttpResponse, ProductData, UserData, UserPayload } from 'src/interfaces';
import { CloudflareService } from 'src/modules/cloudflare/cloudflare.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleException } from 'src/utils';
import { AdminGateway } from '../admin.gateway';
import { CategoryService } from '../category/category.service';
import { ProductVariationService } from '../product-variation/product-variation.service';
import { CreateProductDto } from './dto/create-product.dto';
import { DeleteProductsDto } from './dto/delete-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
   * Subir múltiples imágenes para un producto (máximo 3)
   * @param images Array de imágenes a subir
   * @returns URLs de las imágenes subidas
   */
  async uploadImages(images: Express.Multer.File[]): Promise<string[]> {
    try {
      // Validar cada imagen
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      images.forEach((image) => {
        if (!validMimeTypes.includes(image.mimetype)) {
          throw new BadRequestException(
            'All files must be images in JPEG, PNG, GIF, or WEBP format'
          );
        }
      });

      // Subir las imágenes y crear los registros
      const uploadedUrls = await this.prisma.$transaction(async () => {
        const urls: string[] = [];

        for (let i = 0; i < images.length; i++) {
          // Subir la imagen a Cloudflare
          const imageUrl = await this.cloudflareService.uploadImage(images[i]);

          urls.push(imageUrl);
        }

        return urls;
      });

      return uploadedUrls;
    } catch (error) {
      this.logger.error(`Error uploading images: ${error.message}`, error.stack);
      handleException(error, 'Error uploading images');
    }
  }

  /**
   * Actualizar una imagen específica del producto
   * @param productId ID del producto
   * @param imageId ID de la imagen
   * @param image Nueva imagen
   * @returns URL de la imagen actualizada
   */
  async updateProductImage(
    productId: string,
    imageId: string,
    image: Express.Multer.File
  ): Promise<HttpResponse<string>> {
    try {
      // Verificar que la imagen existe y pertenece al producto
      const existingImage = await this.prisma.productImage.findFirst({
        where: { id: imageId, productId }
      });

      if (!existingImage) {
        throw new NotFoundException('Image not found or does not belong to this product');
      }

      // Validar el tipo de archivo
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(image.mimetype)) {
        throw new BadRequestException(
          'The file must be an image in JPEG, PNG, GIF, or WEBP format'
        );
      }

      // Actualizar la imagen en Cloudflare y el registro
      const imageUrl = await this.cloudflareService.updateImage(image, existingImage.url);

      await this.prisma.productImage.update({
        where: { id: imageId },
        data: { url: imageUrl }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Image updated successfully',
        data: imageUrl
      };
    } catch (error) {
      this.logger.error(`Error updating product image: ${error.message}`, error.stack);
      handleException(error, 'Error updating product image');
    }
  }

  /**
   * Eliminar una imagen específica del producto
   * @param productId ID del producto
   * @param imageId ID de la imagen
   */
  async deleteProductImage(productId: string, imageId: string): Promise<HttpResponse<string>> {
    try {
      // Verificar que la imagen existe y pertenece al producto
      const existingImage = await this.prisma.productImage.findFirst({
        where: { id: imageId, productId }
      });

      if (!existingImage) {
        throw new NotFoundException('Image not found or does not belong to this product');
      }

      await this.prisma.$transaction(async (prisma) => {
        // Eliminar la imagen de Cloudflare
        await this.cloudflareService.deleteImage(existingImage.url);

        // Eliminar el registro de la base de datos
        await prisma.productImage.delete({
          where: { id: imageId }
        });

        // Reordenar las imágenes restantes
        const remainingImages = await prisma.productImage.findMany({
          where: { productId },
          orderBy: { order: 'asc' }
        });

        // Actualizar el orden y asegurar que haya una imagen principal
        for (let i = 0; i < remainingImages.length; i++) {
          await prisma.productImage.update({
            where: { id: remainingImages[i].id },
            data: {
              order: i + 1,
              isMain: i === 0 // La primera imagen será la principal
            }
          });
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Image deleted successfully',
        data: 'Image and its references have been removed'
      };
    } catch (error) {
      this.logger.error(`Error deleting product image: ${error.message}`, error.stack);
      handleException(error, 'Error deleting product image');
    }
  }

  /**
   * Creación del producto
   * @param createProductDto Data del producto
   * @param user Usuario que crea el producto
   * @returns Producto Creado
   */
  async create(
    createProductDto: CreateProductDto,
    images: Express.Multer.File[],
    user: UserData
  ): Promise<HttpResponse<ProductData>> {
    const { name, description, price, categoryId, isRestricted, maxStock } = createProductDto;
    let uploadedUrls: string[] = [];

    try {
      // 1. Validar y subir imágenes primero
      if (images?.length > 0) {
        if (images.length > 3) {
          throw new BadRequestException('No se pueden subir más de 3 imágenes por producto');
        }

        // Validar y subir las imágenes a Cloudflare
        uploadedUrls = await this.uploadImages(images);

        if (!uploadedUrls.length) {
          throw new BadRequestException('Error al subir las imágenes a Cloudflare');
        }
      }

      // 2. Validar la categoría
      if (categoryId) {
        const categoryDB = await this.categoryService.findById(categoryId);
        if (!categoryDB) {
          // Si falla, eliminar las imágenes subidas
          if (uploadedUrls.length > 0) {
            await Promise.all(uploadedUrls.map((url) => this.cloudflareService.deleteImage(url)));
          }
          throw new BadRequestException('Invalid categoryId provided');
        }
      }

      // 3. Solo si las imágenes se subieron correctamente (o no había imágenes),
      // proceder con la creación del producto en una transacción
      const newProduct = await this.prisma.$transaction(async (prisma) => {
        // 1. Crear el nuevo producto con sus datos básicos
        const product = await prisma.product.create({
          data: {
            name,
            description,
            price: parseFloat(price.toString()),
            isRestricted,
            maxStock,
            categoryId
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isRestricted: true,
            isActive: true,
            isAvailable: true,
            maxStock: true,
            category: {
              select: {
                id: true,
                name: true,
                family: true
              }
            },
            images: true
          }
        });
        // 2. Si hay imágenes subidas, crear los registros de imágenes
        if (uploadedUrls.length > 0) {
          await Promise.all(
            uploadedUrls.map((url, index) =>
              prisma.productImage.create({
                data: {
                  url,
                  order: index + 1,
                  isMain: index === 0,
                  productId: product.id
                }
              })
            )
          );
        }

        // 3. Registrar la auditoría de la creación del producto
        await prisma.audit.create({
          data: {
            action: AuditActionType.CREATE,
            entityId: product.id,
            entityType: 'product',
            performedById: user.id
          }
        });

        return product;
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          images: newProduct.images,
          isAvailable: newProduct.isAvailable,
          isActive: newProduct.isActive,
          isRestricted: newProduct.isRestricted,
          maxStock: newProduct.maxStock,
          category: {
            id: newProduct.category.id,
            name: newProduct.category.name,
            family: newProduct.category.family
          }
        }
      };
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);

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
          ...(user.isSuperAdmin ? {} : { isActive: true })
        },
        include: {
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
          },
          images: true
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
        images: product.images,
        isAvailable: product.isAvailable,
        isRestricted: product.isRestricted,
        isActive: product.isActive,
        maxStock: product.maxStock,
        category: {
          id: product.category.id,
          name: product.category.name,
          family: product.category.family
        },
        variations: product.productVariations,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));
    } catch (error) {
      this.logger.error('Error getting all products', error);
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
    images: Express.Multer.File[],
    user: UserData
  ): Promise<HttpResponse<ProductData>> {
    try {
      let uploadedUrls: string[] = [];

      // 1. Obtener y validar el producto
      let product = await this.prisma.product.findUnique({
        where: { id, isActive: true },
        include: {
          category: { select: { id: true, name: true } },
          productVariations: true,
          images: true
        }
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // 2. Manejar eliminación de imágenes existentes
      if (updateProductDto.deleteImages?.length > 0) {
        for (const imageId of updateProductDto.deleteImages) {
          const image = product.images.find((img) => img.id === imageId);
          if (image) {
            await this.cloudflareService.deleteImage(image.url);
            await this.prisma.productImage.delete({ where: { id: imageId } });
          }
        }

        // Recargar el producto para tener las imágenes actualizadas
        product = await this.prisma.product.findUnique({
          where: { id },
          include: {
            category: { select: { id: true, name: true } },
            productVariations: true,
            images: true
          }
        });
      }

      // 3. Validar y procesar nuevas imágenes
      if (images?.length > 0) {
        const currentImagesCount = product.images.length;
        if (currentImagesCount + images.length > 3) {
          throw new BadRequestException('El producto no puede tener más de 3 imágenes');
        }
        uploadedUrls = await this.uploadImages(images);
      }

      // 4. Validar categoría
      let categoryUpdate = undefined;
      if (updateProductDto.categoryId) {
        const categoryDB = await this.categoryService.findById(updateProductDto.categoryId);
        if (!categoryDB) {
          if (uploadedUrls.length > 0) {
            await Promise.all(uploadedUrls.map((url) => this.cloudflareService.deleteImage(url)));
          }
          throw new BadRequestException('Invalid categoryId provided');
        }
        categoryUpdate = { connect: { id: updateProductDto.categoryId } };
      }

      // 5. Actualizar el producto en una transacción
      const updatedProduct = await this.prisma.$transaction(async (prisma) => {
        const orders = product.images.map((img) => img.order);
        // Obtenemos el order que no existe
        const order = Array.from({ length: orders.length + 1 }, (_, i) => i + 1).find(
          (i) => !orders.includes(i)
        );

        const productUpdate = await prisma.product.update({
          where: { id },
          data: {
            name: updateProductDto.name,
            description: updateProductDto.description,
            price:
              updateProductDto.price !== undefined
                ? parseFloat(updateProductDto.price.toString())
                : undefined,
            maxStock:
              updateProductDto.maxStock !== undefined
                ? parseFloat(updateProductDto.maxStock.toString())
                : undefined,
            category: categoryUpdate,
            ...(uploadedUrls.length > 0 && {
              images: {
                create: uploadedUrls.map((url, index) => ({
                  url,
                  order,
                  isMain: product.images.length === 0 && index === 0
                }))
              }
            })
          },
          include: {
            category: { select: { id: true, name: true, family: true } },
            productVariations: true,
            images: true
          }
        });

        // Registrar auditoría
        await prisma.audit.create({
          data: {
            entityId: productUpdate.id,
            action: AuditActionType.UPDATE,
            performedById: user.id,
            entityType: 'product'
          }
        });

        return productUpdate;
      });

      // Retornar la respuesta con los datos actualizados
      return {
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          images: updatedProduct.images,
          isAvailable: updatedProduct.isAvailable,
          isActive: updatedProduct.isActive,
          isRestricted: updatedProduct.isRestricted,
          maxStock: updatedProduct.maxStock,
          category: {
            id: updatedProduct.category.id,
            name: updatedProduct.category.name,
            family: updatedProduct.category.family
          }
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
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        images: true
      }
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

        // Retornar la estructura deseada, incluyendo variaciones e imágenes
        return {
          id: productDB.id,
          name: productDB.name,
          description: productDB.description,
          price: productDB.price,
          images: productDB.images,
          isAvailable: productDB.isAvailable,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          maxStock: productDB.maxStock,
          category: {
            id: productDB.category.id,
            name: productDB.category.name,
            family: productDB.category.family
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
   * Eliminar permanentemente un producto
   * @param id Id del producto
   * @returns Producto eliminado
   */
  async removePermanent(id: string): Promise<void> {
    try {
      const productDB = await this.prisma.product.findFirst({
        where: { id },
        include: {
          images: true
        }
      });

      if (!productDB) {
        throw new NotFoundException('Product not found');
      }

      await this.prisma.$transaction(async (prisma) => {
        // Eliminar las variaciones del producto
        await prisma.productVariation.deleteMany({
          where: { productId: id }
        });

        // Eliminar las imágenes del producto
        await prisma.productImage.deleteMany({
          where: { productId: id }
        });

        // Eliminar el producto
        await prisma.product.delete({
          where: { id }
        });
      });
    } catch (error) {
      this.logger.error(`Error deleting a product for id: ${id}`, error.stack);
      handleException(error, 'Error deleting a product');
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
          include: {
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
            images: true
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
            images: productDelete.images,
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
      include: {
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
        },
        images: true
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
      images: productDB.images,
      isAvailable: productDB.isAvailable,
      isActive: productDB.isActive,
      isRestricted: productDB.isRestricted,
      maxStock: productDB.maxStock,
      category: productDB.category
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
          include: {
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
            },
            images: true
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
          images: productDB.images,
          isAvailable: newStatus,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          maxStock: productDB.maxStock,
          category: {
            id: productDB.category.id,
            name: productDB.category.name,
            family: productDB.category.family
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
          include: {
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
            },
            images: true
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
          images: productDB.images,
          isAvailable: productDB.isAvailable,
          isActive: productDB.isActive,
          isRestricted: productDB.isRestricted,
          maxStock: productDB.maxStock,
          category: {
            id: productDB.category.id,
            name: productDB.category.name,
            family: productDB.category.family
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
        const productsDB = await prisma.product.findMany({
          where: {
            id: { in: products.ids }
          },
          include: {
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
            images: true
          }
        });

        if (productsDB.length === 0) {
          throw new NotFoundException('Products not found or inactive');
        }

        const reactivatePromises = productsDB.map(async (product) => {
          await prisma.product.update({
            where: { id: product.id },
            data: { isActive: true }
          });

          await prisma.audit.create({
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
            images: product.images,
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
        message: 'Products reactivated successfully'
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
   * Descargar todos los productos en formato CSV
   * @returns Archivo CSV con todos los productos
   */
  async generateCsv() {
    try {
      // Obtener todos los productos con sus variaciones
      const products = await this.prisma.product.findMany({
        include: {
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
        }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      this.configureWorksheet(worksheet);

      // Agregar los datos de productos
      products.forEach((product) => {
        const row = worksheet.addRow({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toFixed(2),
          maxStock: product.maxStock || 'No definido',
          category: product.category.name,
          family: product.category.family,
          isAvailable: product.isAvailable ? 'Disponible' : 'No disponible',
          isActive: product.isActive ? 'Activo' : 'Inactivo'
        });

        // Alinear las columnas numéricas a la derecha
        row.getCell('price').alignment = { horizontal: 'right' };
        row.getCell('maxStock').alignment = { horizontal: 'right' };
      });

      // Ajustar automáticamente el ancho de las columnas
      worksheet.columns.forEach((column) => {
        column.width = Math.max(column.width || 10, 15);
      });

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      this.logger.error('Error downloading all products', error.stack);
      handleException(error, 'Error downloading all products');
    }
  }

  private configureWorksheet(worksheet: ExcelJS.Worksheet) {
    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Descripción', key: 'description', width: 50 },
      { header: 'Precio', key: 'price', width: 15 },
      { header: 'Stock Máximo', key: 'maxStock', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Familia', key: 'family', width: 20 },
      { header: 'Disponibilidad', key: 'isAvailable', width: 15 },
      { header: 'Estado', key: 'isActive', width: 15 }
    ];

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2F0D9' }
    };
  }
}
