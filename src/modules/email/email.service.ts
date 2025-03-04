import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from 'src/interfaces/event-types.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { getFirstWord } from 'src/utils';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly prismaService: PrismaService
  ) {}

  @OnEvent('user.welcome-admin-first')
  async welcomeEmail(data: EventPayloads['user.welcome-admin-first']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const { name, email, password, webAdmin } = data;
    const subject = `Bienvenido a ${infoBusiness.businessName}: ${getFirstWord(name)}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'welcome-admin-first',
        context: {
          name,
          email,
          password,
          webAdmin,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('client.forgot-password')
  async forgotPassword(data: EventPayloads['client.forgot-password']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const { name, email, link } = data;
    const subject = `Recuperar contraseña de ${infoBusiness.businessName}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'forgot-password',
        context: {
          name,
          email,
          link,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('user.new-password')
  async newPassword(data: EventPayloads['user.new-password']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const { name, email, password, webAdmin } = data;
    const subject = `Hola de nuevo: ${getFirstWord(name)}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'new-password',
        context: {
          name,
          email,
          password,
          webAdmin,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('class.new-class')
  async newClass(data: EventPayloads['class.new-class']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const {
      name,
      email,
      scheduleClass,
      dateClass,
      languageClass,
      totalParticipants,
      totalPrice,
      typeCurrency
    } = data;
    const subject = `Workshop scheduled: ${infoBusiness.businessName}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'new-class',
        context: {
          name,
          email,
          scheduleClass,
          dateClass,
          languageClass: languageClass.charAt(0).toUpperCase() + languageClass.slice(1),
          totalParticipants,
          totalPrice,
          typeCurrency,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('order.new-order')
  async newOrder(data: EventPayloads['order.new-order']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const { name, email, orderNumber, totalOrder, pickupDate } = data;
    const subject = `Order placed: ${infoBusiness.businessName}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'new-order',
        context: {
          name,
          email,
          orderNumber,
          totalOrder,
          pickupDate,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('order.order-completed')
  async orderCompleted(data: EventPayloads['order.order-completed']): Promise<boolean> {
    const infoBusiness = await this.prismaService.businessConfig.findFirst();
    const { name, email, orderNumber, totalOrder, products, pickupDate } = data;
    const subject = `Order completed: ${infoBusiness.businessName}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'order-completed',
        context: {
          name,
          email,
          orderNumber,
          totalOrder,
          products,
          pickupDate,
          business: infoBusiness.businessName,
          url: process.env.WEB_URL,
          phone: infoBusiness.contactNumber,
          address: infoBusiness.address,
          contact: infoBusiness.email
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }
}
