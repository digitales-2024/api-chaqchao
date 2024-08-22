import { User } from '@prisma/client';
import { Rol } from './rol.type';

export type UserPayload = Pick<
  User,
  'id' | 'name' | 'email' | 'isActive' | 'phone' | 'mustChangePassword' | 'lastLogin'
> & {
  roles: Omit<Rol, 'description'>[];
};

export type UserData = Omit<UserPayload, 'isActive' | 'mustChangePassword' | 'lastLogin'>;

export type UserDataLogin = Pick<UserPayload, 'id' | 'name' | 'email' | 'phone' | 'roles'> & {
  token: string;
};
