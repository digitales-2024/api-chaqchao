import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function Auth() {
  // return applyDecorators(RoleProtected(...roles), UseGuards(AuthGuard('jwt'), UserRoleGuard));
  return applyDecorators(UseGuards(AuthGuard('jwt')));
}
