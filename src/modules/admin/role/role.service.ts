import { Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../users/interfaces/user.interface';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, user: User): Promise<CreateRoleDto> {
    const newRol = await this.prisma.rol.create({
      data: { ...createRoleDto, createdBy: user.id, updatedBy: user.id }
    });
    return newRol;
  }

  findAll() {
    return `This action returns all role`;
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    console.log(updateRoleDto);
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
