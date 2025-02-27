import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateClassCapacityDto } from './dto/create-class-capacity.dto';
import { UpdateClassCapacityDto } from './dto/update-class-capacity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse, UserData } from 'src/interfaces';
import { handleException } from 'src/utils';
import { TypeClass } from '@prisma/client';

@Injectable()
export class ClassCapacityService {
  private readonly logger = new Logger(ClassCapacityService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una capacidad para un tipo de clase
   * @param createClassCapacityDto Data para crear una capacidad para un tipo de clase
   * @param user Usuario que crea la capacidad
   * @returns La capacidad creada
   */
  async create(
    createClassCapacityDto: CreateClassCapacityDto,
    user: UserData
  ): Promise<
    HttpResponse<{
      typeClass: TypeClass;
      minCapacity: number;
      maxCapacity: number;
    }>
  > {
    try {
      const businessConfig = await this.prisma.businessConfig.findMany({
        select: {
          id: true
        }
      });

      if (businessConfig.length === 0) {
        throw new BadRequestException('No existe el la empresa configurada');
      }

      // Validar que no se haya creado ya una capacidad para el businessId y typeClass proporcionados
      const existingCapacity = await this.prisma.classCapacity.findFirst({
        where: {
          businessId: businessConfig[0].id,
          typeClass: createClassCapacityDto.typeClass
        }
      });

      if (existingCapacity) {
        throw new BadRequestException(
          'La configuracion de la capacidad para este tipo de clase ya existe'
        );
      }

      const newCapacity = await this.prisma.classCapacity.create({
        data: {
          businessId: businessConfig[0].id,
          typeClass: createClassCapacityDto.typeClass,
          minCapacity: createClassCapacityDto.minCapacity,
          maxCapacity: createClassCapacityDto.maxCapacity
        },
        select: {
          id: true,
          typeClass: true,
          minCapacity: true,
          maxCapacity: true
        }
      });

      // Crear una auditoría de la capacidad de clase creada
      await this.prisma.audit.create({
        data: {
          performedById: user.id,
          action: 'CREATE',
          entityType: 'classCapacity',
          entityId: newCapacity.id
        }
      });

      return {
        statusCode: 201,
        message: 'Capacidad de clase creada con éxito',
        data: {
          typeClass: newCapacity.typeClass,
          minCapacity: newCapacity.minCapacity,
          maxCapacity: newCapacity.maxCapacity
        }
      };
    } catch (error) {
      this.logger.error('Error a crear la capacidad para este tipo de clases');
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error a crear la capacidad para este tipo de clases');
    }
  }

  /**
   * Obtener todas las capacidades de clase
   * @returns Todas las capacidades de clase
   */
  async findAll(): Promise<any> {
    try {
      const classCapacities = await this.prisma.classCapacity.findMany({
        select: {
          id: true,
          typeClass: true,
          minCapacity: true,
          maxCapacity: true
        }
      });

      // Agrupar los resultados typeClass
      const groupedClassesSchedule = classCapacities.reduce(
        (acc, classSchedule) => {
          const typeClass = classSchedule.typeClass;
          acc[typeClass] = {
            ...acc[typeClass],
            id: classSchedule.id,
            typeClass: classSchedule.typeClass,
            minCapacity: classSchedule.minCapacity,
            maxCapacity: classSchedule.maxCapacity
          };
          return acc;
        },
        {} as Record<
          TypeClass,
          { id: string; typeClass: TypeClass; minCapacity: number; maxCapacity: number }
        >
      );

      return groupedClassesSchedule;
    } catch (error) {
      this.logger.error('Error al obtener todas las capacidades de clase', error);
      handleException(error, 'Error al obtener todas las capacidades de clase');
    }
  }

  /**
   * Obtener una capacidad de clase por su id
   * @param id Id de la capacidad de clase
   * @returns La capacidad de clase encontrada
   * @throws {BadRequestException} Si la capacidad de clase no existe
   */
  async findOne(id: string): Promise<{
    typeClass: TypeClass;
    minCapacity: number;
    maxCapacity: number;
  }> {
    try {
      const classCapacity = await this.prisma.classCapacity.findUnique({
        where: { id },
        select: {
          id: true,
          typeClass: true,
          minCapacity: true,
          maxCapacity: true
        }
      });

      if (!classCapacity) {
        throw new BadRequestException('Capacidad de clase no encontrada');
      }

      return classCapacity;
    } catch (error) {
      this.logger.error('Error al obtener la capacidad de clase', error);
      handleException(error, 'Error al obtener la capacidad de clase');
    }
  }

  /**
   * Actualizar una capacidad de clase
   * @param id Id de la capacidad de clase a actualizar
   * @param updateClassCapacityDto Datos para actualizar la capacidad de clase
   * @param user Usuario que actualiza la capacidad de clase
   * @returns La capacidad de clase actualizada
   */
  async update(
    id: string,
    updateClassCapacityDto: UpdateClassCapacityDto,
    user: UserData
  ): Promise<
    HttpResponse<{
      typeClass: TypeClass;
      minCapacity: number;
      maxCapacity: number;
    }>
  > {
    try {
      const existingClassCapacity = await this.prisma.classCapacity.findUnique({
        where: { id },
        select: {
          id: true
        }
      });

      if (!existingClassCapacity) {
        throw new BadRequestException('Capacidad de clase no encontrada');
      }

      // Verificar que la capacidad minima sea menor que la capacidad maxima
      if (updateClassCapacityDto.minCapacity > updateClassCapacityDto.maxCapacity) {
        throw new BadRequestException(
          'La capacidad minima no puede ser mayor que la capacidad maxima'
        );
      }

      const updatedClassCapacity = await this.prisma.classCapacity.update({
        where: {
          id: existingClassCapacity.id
        },
        data: updateClassCapacityDto,
        select: {
          id: true,
          typeClass: true,
          minCapacity: true,
          maxCapacity: true
        }
      });

      if (!updatedClassCapacity) {
        throw new BadRequestException('Capacidad de clase no encontrada');
      }

      // Crear una auditoría de la capacidad de clase actualizada
      await this.prisma.audit.create({
        data: {
          performedById: user.id,
          action: 'UPDATE',
          entityType: 'classCapacity',
          entityId: updatedClassCapacity.id
        }
      });

      return {
        statusCode: 200,
        message: 'Class capacity updated successfully',
        data: {
          typeClass: updatedClassCapacity.typeClass,
          minCapacity: updatedClassCapacity.minCapacity,
          maxCapacity: updatedClassCapacity.maxCapacity
        }
      };
    } catch (error) {
      this.logger.error('Error de actualización de la capacidad de clase', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error de actualización de la capacidad de clase');
    }
  }

  /**
   * Eliminar una capacidad de clase por su identificación
   * @param id La identificación de la capacidad de clase para eliminar
   * @returns Se eliminó un mensaje que indica la capacidad de la clase
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<void>> {
    try {
      const classCapacity = await this.prisma.classCapacity.findUnique({
        where: { id },
        select: {
          id: true
        }
      });

      if (!classCapacity) {
        throw new BadRequestException('Capacidad de clase no encontrada');
      }

      await this.prisma.classCapacity.delete({
        where: {
          id: classCapacity.id
        }
      });

      // Crear una auditoría de la capacidad de clase eliminada
      await this.prisma.audit.create({
        data: {
          performedById: user.id,
          action: 'DELETE',
          entityType: 'classCapacity',
          entityId: classCapacity.id
        }
      });

      return {
        statusCode: 200,
        message: 'Class capacity deleted successfully',
        data: null
      };
    } catch (error) {
      this.logger.error('Error al eliminar la capacidad de clase', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error al eliminar la capacidad de clase');
    }
  }
}
