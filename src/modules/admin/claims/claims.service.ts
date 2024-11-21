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
  async findAll(): Promise<{ statusCode: number; message: string; data: ClaimsData[] }> {
    try {
      const claims = await this.prisma.claims.findMany({});

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
