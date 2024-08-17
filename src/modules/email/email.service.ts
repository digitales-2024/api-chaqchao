import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from 'src/interfaces/event-types.interface';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('user.welcome-admin-first')
  async welcomeEmail(data: EventPayloads['user.welcome-admin-first']) {
    const { name, email } = data;
    const subject = `Welcome to Company: ${name}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'welcome',
        context: { name }
      });
    } catch (error) {}
  }
}
