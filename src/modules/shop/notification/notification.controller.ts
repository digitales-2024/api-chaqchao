import { Controller, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { NotificationData } from 'src/interfaces/notification.interface';
import { Auth } from 'src/modules/admin/auth/decorators';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBadRequestResponse({ description: 'Bas Request' })
@ApiUnauthorizedResponse({ description: 'UnAuthorized' })
@Auth()
@Controller({
  path: 'notification',
  version: '1'
})
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOkResponse({ description: 'Get all notifications' })
  @Get()
  findAll(): Promise<NotificationData[]> {
    return this.notificationService.findAll();
  }
}
