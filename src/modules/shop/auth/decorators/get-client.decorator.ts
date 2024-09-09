import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException
} from '@nestjs/common';
import { ClientData } from 'src/interfaces';

export const GetClient = createParamDecorator((data, ctx: ExecutionContext): ClientData => {
  const request = ctx.switchToHttp().getRequest();
  const client = request.user;
  console.log('Client from GetClient:', client);

  if (!client) {
    throw new InternalServerErrorException('Client not found');
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email
  };
});
