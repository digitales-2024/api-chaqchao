import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { handleException } from 'src/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { HttpResponse, ClaimsData } from 'src/interfaces';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Crear un Reclamo
   * @param createClaimDto Data para crear un reclamo
   */
  async create(createClaimDto: CreateClaimDto): Promise<HttpResponse<ClaimsData>> {
    try {
      const defaultValues = {
        claimantAddress: '',
        claimantRepresentative: '',
        amountClaimed: ''
      };

      const claimCreated = await this.prisma.claims.create({
        data: {
          ...defaultValues,
          ...createClaimDto
        },
        select: {
          id: true,
          claimantName: true,
          claimantAddress: true,
          documentNumber: true,
          claimantEmail: true,
          claimantPhone: true,
          claimantRepresentative: true,
          assetType: true,
          amountClaimed: true,
          assetDescription: true,
          claimDescription: true,
          dateClaim: true
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Claim created successfully',
        data: claimCreated
      };
    } catch (error) {
      this.logger.error(`Error creating claims: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      handleException(error, 'Error creating a claim');
    }
  }

  /**
   * Listar todos los reclamos
   * @param createClaimDto Data para crear un reclamo
   */
  async findAll(
    date?: string
  ): Promise<{ statusCode: number; message: string; data: ClaimsData[] }> {
    try {
      const filter = date
        ? {
            dateClaim: {
              gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(date).setHours(23, 59, 59, 999))
            }
          }
        : {};

      const claims = await this.prisma.claims.findMany({
        where: filter,
        orderBy: { dateClaim: 'desc' }
      });

      return {
        statusCode: HttpStatus.OK,
        message: claims.length > 0 ? 'Claims retrieved successfully' : 'No claims found',
        data: claims
      };
    } catch (error) {
      this.logger.error('Error getting all claims', error.stack);

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving claims',
        data: []
      };
    }
  }
}
