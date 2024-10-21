import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminGateway } from 'src/modules/admin/admin.gateway';
import { Cron } from '@nestjs/schedule';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class BusinessHoursService {
  private readonly logger = new Logger(BusinessHoursService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminGateway: AdminGateway
  ) {}

  // Método que se ejecutará cada minuto
  @Cron('0 10 * * * *') // Cada minuto
  async handleCron() {
    this.logger.log('Cron job executed'); // Log para verificar que el cron job se ejecuta
    await this.updateBusinessStatus();
  }

  async updateBusinessStatus() {
    const currentTime = new Date();
    console.log(currentTime.getHours() + '-' + currentTime.getMinutes());
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60; // Hora actual en formato decimal
    const currentDay = currentTime.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

    this.logger.log(`Current hour: ${currentHour}, Current day: ${currentDay}`); // Log de la hora y el día actual

    const businessHours = await this.prismaService.businessHours.findMany();

    if (businessHours.length === 0) {
      this.logger.warn('No business hours found'); // Log si no hay horarios
      return; // Salir si no hay horarios
    }

    for (const hours of businessHours) {
      const openingTime = this.parseTime(hours.openingTime);
      const closingTime = this.parseTime(hours.closingTime);

      const businessDay = this.getBusinessDay(currentDay);

      this.logger.log(`Checking business hours for ID: ${hours.businessId}, Day: ${businessDay}`);

      // Verificar si el negocio trabaja en el día actual
      if (businessDay === hours.dayOfWeek) {
        if (hours.isOpen) {
          const isCurrentlyOpen = currentHour >= openingTime && currentHour < closingTime;

          // Emitir mensaje de apertura o cierre
          const message = isCurrentlyOpen ? 'El negocio está abierto.' : 'El negocio está cerrado.';
          this.logger.log(`Business ID: ${hours.businessId}, Message: ${message}`); // Mostrar mensaje

          // Emitir estado a través de WebSocket
          this.adminGateway.sendBusinessStatusUpdated(hours.businessId, isCurrentlyOpen);
        } else {
          // Si isOpen es false, el negocio no está abierto ese día
          this.logger.log(`Business ID: ${hours.businessId} no trabaja hoy.`); // Mensaje indicando que no trabaja
        }
      } else {
        this.logger.log(
          `Business ID: ${hours.businessId} is not scheduled to work today (${businessDay}).`
        ); // Log si no es el día correspondiente
      }
    }
  }

  private getBusinessDay(currentDay: number): DayOfWeek {
    switch (currentDay) {
      case 0:
        return DayOfWeek.SUNDAY;
      case 1:
        return DayOfWeek.MONDAY;
      case 2:
        return DayOfWeek.TUESDAY;
      case 3:
        return DayOfWeek.WEDNESDAY;
      case 4:
        return DayOfWeek.THURSDAY;
      case 5:
        return DayOfWeek.FRIDAY;
      case 6:
        return DayOfWeek.SATURDAY;
      default:
        throw new Error('Invalid day of the week');
    }
  }

  private parseTime(timeString: string): number {
    const [hour, minute] = timeString.split(':').map(Number);
    return hour + minute / 60; // Devuelve la hora en formato decimal
  }
}
