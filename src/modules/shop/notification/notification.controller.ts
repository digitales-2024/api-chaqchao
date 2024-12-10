import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiExcludeController, ApiOkResponse } from '@nestjs/swagger';
import { NotificationData } from 'src/interfaces/notification.interface';
import { Auth } from 'src/modules/admin/auth/decorators';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { HttpResponse } from 'src/interfaces';

@ApiExcludeController()
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

  @ApiCreatedResponse({ description: 'Notification created successfully' })
  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto
  ): Promise<HttpResponse<NotificationData>> {
    return this.notificationService.create(createNotificationDto);
  }
}
