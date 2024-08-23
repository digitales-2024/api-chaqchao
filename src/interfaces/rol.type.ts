import { Rol as RolPrisma } from '@prisma/client';
import { ModulePermissionsData } from './module-permissions.interface';

export type Rol = Pick<RolPrisma, 'id' | 'name' | 'description'>;

export type RolPermissions = {
  id: string;
  name: string;
  description?: string;
  modulePermissions: ModulePermissionsData[];
};
