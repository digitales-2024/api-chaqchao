import { ModulePermissions, Rol as RolPrisma } from '@prisma/client';

export type Rol = Pick<RolPrisma, 'id' | 'name' | 'description'>;

export type RolPermissions = {
  id: string;
  name: string;
  description?: string;
  modulePermissions: ModulePermissions[];
};
