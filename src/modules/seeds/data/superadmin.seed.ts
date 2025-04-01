import { ValidRols } from 'src/modules/admin/auth/interfaces';

export const superAdminSeed = {
  name: 'Super Admin',
  email: 'factory.chaqchao@gmail.com',
  password: '$$factorychaqchao$$',
  phone: '+51 54 234572',
  mustChangePassword: false
};

export const rolSuperAdminSeed = {
  name: ValidRols.SUPER_ADMIN,
  description: 'Super Administrador'
};
