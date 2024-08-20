import { Rol as RolPrisma } from '@prisma/client';

export type Rol = Pick<RolPrisma, 'id' | 'name' | 'description'>;
