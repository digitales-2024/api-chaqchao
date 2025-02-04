import { applyDecorators, UseGuards } from '@nestjs/common';
import { Modules, Permissions } from './module-permissions.decorator';
import { ModulePermissionsGuard } from '../guards/modules-permissions.guard';

export function Module(module: string) {
  return applyDecorators(Modules(module), UseGuards(ModulePermissionsGuard));
}
export function Permission(permissions: string[]) {
  return applyDecorators(Permissions(permissions), UseGuards(ModulePermissionsGuard));
}
