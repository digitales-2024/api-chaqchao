import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function RefreshAuth() {
  return applyDecorators(UseGuards(AuthGuard('jwt-refresh')));
}
