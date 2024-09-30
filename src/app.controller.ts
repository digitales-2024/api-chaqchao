import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('ping')
  @Version('1')
  ping(): string {
    return 'Pong!';
  }
}
