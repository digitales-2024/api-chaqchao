// business.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BusinessHoursService {
  private readonly logger = new Logger(BusinessHoursService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminGateway: AdminGateway
  ) {}

  @Cron('*/1 * * * *') // Ejecutar cada minuto
  async handleCron() {
    this.logger.log('Cron job executed');
    await this.updateBusinessStatus();
  }

  async updateBusinessStatus() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60; // Hora actual en formato decimal
    const currentDay = currentTime.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

    this.logger.log(`Current hour: ${currentHour}, Current day: ${currentDay}`);

    const businessConfigs = await this.prismaService.businessConfig.findMany({
      include: {
        businessHours: true
      }
    });

    for (const business of businessConfigs) {
      let isOpenToday = false;
      let isCurrentlyOpen = false;

      for (const hours of business.businessHours) {
        if (this.getBusinessDay(currentDay) === hours.dayOfWeek) {
          isOpenToday = hours.isOpen;

          const openingDecimal = this.parseTime(hours.openingTime);
          const closingDecimal = this.parseTime(hours.closingTime);

          // Verificar si está dentro del horario de apertura
          isCurrentlyOpen =
            isOpenToday && currentHour >= openingDecimal && currentHour < closingDecimal;
        }
      }

      // Emitir el estado
      this.adminGateway.sendBusinessStatusUpdated(business.id, isCurrentlyOpen);
    }
  }

  private getBusinessDay(currentDay: number): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[currentDay];
  }

  private parseTime(timeString: string): number {
    const [hour, minute] = timeString.split(':').map(Number);
    return hour + minute / 60;
  }
}
