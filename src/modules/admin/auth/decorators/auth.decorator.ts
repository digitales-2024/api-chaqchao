import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MustChangePasswordGuard } from '../guards/must-change-password-guards.guard';
import { TokenRefresh } from '../guards/token-refresh.guard';

export function Auth() {
  return applyDecorators(
    UseGuards(AuthGuard('jwt')),
    UseGuards(MustChangePasswordGuard),
    UseGuards(TokenRefresh)
  );
}
