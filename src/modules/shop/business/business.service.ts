import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AllBusinessHoursData } from 'src/interfaces';
import { BusinessHoursService } from 'src/modules/admin/business-hours/business-hours.service';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly businessHoursService: BusinessHoursService) {}
  async findBusiness(): Promise<AllBusinessHoursData> {
    try {
      const hoursBusiness = await this.businessHoursService.findAll();

      return hoursBusiness;
    } catch (error) {
      this.logger.error(`Error find business: ${error.message}`, error.stack);

      throw new BadRequestException('Error find business');
    }
  }
}
