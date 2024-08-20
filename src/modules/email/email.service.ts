import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from 'src/interfaces/event-types.interface';
import { getFirstWord } from 'src/utils';

const infoBusiness = {
  business: 'Chaqchao',
  url: 'https://chaqchao.com',
  phone: '+51 999 999 998',
  address: '1234 Street',
  contact: 'contacto@gmail.com'
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('user.welcome-admin-first')
  async welcomeEmail(
    data: EventPayloads['user.welcome-admin-first']
  ): Promise<{ success: boolean }> {
    const { name, email, password } = data;
    const subject = `Bienvenido a ${infoBusiness.business}: ${getFirstWord(name)}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'welcome-admin-first',
        context: {
          name,
          email,
          password,
          business: infoBusiness.business,
          url: infoBusiness.url,
          phone: infoBusiness.phone,
          address: infoBusiness.address,
          contact: infoBusiness.contact
        }
      });

      if (sendingEmail) {
        return { success: true }; // Retorna un objeto indicando éxito
      } else {
        return { success: false }; // Retorna un objeto indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      // handleException(error, 'Error sending email');
      return { success: false }; // Retorna un objeto indicando fallo
    }
  }
}
