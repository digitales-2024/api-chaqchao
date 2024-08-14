import { ValidRoles } from 'src/modules/admin/auth/interfaces';

export const superAdminSeed = {
  name: 'Super Admin',
  email: 'admin@admin.com',
  password: 'admin',
  phone: '1234567890',
  mustChangePassword: false
};

export const rolSuperAdminSeed = {
  name: ValidRoles.SUPER_ADMIN,
  description: 'Super Administrador'
};
