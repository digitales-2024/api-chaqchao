import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MustChangePasswordGuard } from '../guards/must-change-password-guards.guard';

export function Auth() {
  // return applyDecorators(RolProtected(...rols), UseGuards(AuthGuard('jwt'), UserRolGuard));
  return applyDecorators(UseGuards(AuthGuard('jwt')), UseGuards(MustChangePasswordGuard));
}
