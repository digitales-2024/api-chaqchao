import { Client } from '@prisma/client';

export type ClientData = Pick<Client, 'name' | 'email' | 'token'>;
