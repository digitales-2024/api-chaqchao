import { Client } from '@prisma/client';

export type ClientGoogleData = Pick<Client, 'name' | 'email' | 'image' | 'token'>;

export type ClientData = Pick<Client, 'id' | 'name' | 'email' | 'lastName' | 'phone' | 'image'>;

export type ClientPayload = Pick<
  Client,
  | 'id'
  | 'name'
  | 'email'
  | 'lastName'
  | 'image'
  | 'phone'
  | 'birthDate'
  | 'isGoogleAuth'
  | 'lastLogin'
  | 'isActive'
>;

export type ClientDataUpdate = Pick<Client, 'id' | 'name' | 'phone' | 'birthDate'>;
