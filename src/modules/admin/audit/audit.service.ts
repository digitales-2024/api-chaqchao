import { Injectable, Logger } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Crear una nueva auditoría
   * @param createAuditDto Datos de la auditoría a crear
   */
  async create(createAuditDto: CreateAuditDto): Promise<void> {
    try {
      await this.prismaService.audit.create({
        data: createAuditDto
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
