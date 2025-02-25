import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class PickupCodeService {
  private readonly logger = new Logger(PickupCodeService.name);
  private readonly prefix = 'ORD';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inicializa la secuencia si no existe.
   */
  async initializeSequence() {
    const sequence = await this.prisma.pickupCodeSequence.findUnique({
      where: { id: 1 }
    });

    if (!sequence) {
      this.logger.log('Initializing pickupCode sequence.');
      await this.prisma.pickupCodeSequence.create({
        data: {
          id: 1,
          currentSeq: 0
        }
      });
    }
  }

  /**
   * Genera el siguiente pickupCode de manera secuencial con prefijo fijo.
   * @returns pickupCode generado.
   */
  async generatePickupCode(): Promise<string> {
    // Asegurar que la secuencia esté inicializada
    await this.initializeSequence();

    try {
      // Ejecutar una transacción para garantizar atomicidad
      const newSeq = await this.prisma.$transaction(async (prisma) => {
        const updatedSequence = await prisma.pickupCodeSequence.update({
          where: { id: 1 },
          data: { currentSeq: { increment: 1 } }
        });

        return updatedSequence.currentSeq;
      });

      // Formatear el número secuencial con ceros a la izquierda
      const formattedSeq = newSeq.toString().padStart(4, '0'); // 4 dígitos, e.g., '0001'

      // Concatenar el prefijo con el número secuencial
      const pickupCode = `${this.prefix}${formattedSeq}`; // 'PD0001'

      this.logger.log(`Generado pickupCode: ${pickupCode}`);

      return pickupCode;
    } catch (error) {
      this.logger.error('Error al generar pickupCode:', error);
      throw new ConflictException('Error al generar el pickupCode.');
    }
  }
}
