import { Client } from '@prisma/client';

export type ClientGoogleData = Pick<Client, 'name' | 'email' | 'token'>;

export type ClientDataLogin = Pick<Client, 'id' | 'name' | 'email'> & {
  token: string;
};

export type ClientData = Pick<Client, 'id' | 'name' | 'email'>;

export type ClientPayload = Pick<
  Client,
  'id' | 'name' | 'email' | 'phone' | 'birthDate' | 'isGoogleAuth' | 'lastLogin' | 'isActive'
>;

export type ClientDataUpdate = Pick<Client, 'id' | 'name' | 'phone' | 'birthDate'>;
