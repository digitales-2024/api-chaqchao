import { Rol as RolPrisma } from '@prisma/client';
import { Permission } from './permission.interface';

export type Rol = Pick<RolPrisma, 'id' | 'name' | 'description'>;

export type RolPermissions = {
  id: string;
  name: string;
  description?: string;
  rolPermissions: RolModulesPermissions[];
};

export interface ModulePermissionDto {
  moduleId: string;
  permissionIds: string[];
}

export interface RolModulesPermissions {
  id: string;
  cod: string;
  name: string;
  description: string;
  permissions: Permission[];
}
export interface RolModulePermissions {
  rolId: string;
  modulePermissionsId: string;
}
