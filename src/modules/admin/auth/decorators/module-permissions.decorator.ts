import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'module';
export const PERMISSIONS_KEY = 'permissions';
export const Modules = (module: string) => SetMetadata(MODULE_KEY, module);
export const Permissions = (permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
