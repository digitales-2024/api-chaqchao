import { Injectable, Logger } from '@nestjs/common';
import { ClientData } from 'src/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
/* import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto'; */

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(client: ClientData) {
    console.log('AuthService');
    console.log(client);
    const clientDB = await this.prisma.client.findUnique({
      where: {
        email: client.email
      }
    });
    if (clientDB) {
      return clientDB;
    }
  }
  /*   create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  } */
}
