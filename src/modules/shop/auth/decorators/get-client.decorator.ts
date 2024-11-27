import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientData } from 'src/interfaces';

export const GetClient = createParamDecorator((data, ctx: ExecutionContext): ClientData => {
  const request = ctx.switchToHttp().getRequest();
  const client = request.user;
  if (!client) {
    return null;
  }

  return {
    id: client.id,
    name: client.name,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    image: client.image
  };
});
