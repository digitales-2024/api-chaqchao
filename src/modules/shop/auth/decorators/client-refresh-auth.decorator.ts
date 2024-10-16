import { applyDecorators, UseGuards } from '@nestjs/common';
import { RefreshAuthGuard } from '../guards/refresh-auth.guard';

export function ClientRefreshAuth() {
  return applyDecorators(UseGuards(RefreshAuthGuard));
}
