import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY, PERMISSIONS_KEY } from '../decorators/module-permissions.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { decodeJwt } from 'src/utils/decodeToken';
import { RolService } from '../../rol/rol.service';

@Injectable()
export class ModulePermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private rol: RolService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookies = request.cookies;

    if (!cookies.access_token) {
      return false;
    }

    // Decode el token
    const token = cookies.access_token;
    const decoded = decodeJwt(token);
    // Verificar si el token es válido
    if (!decoded) {
      return false;
    }

    // Buscar el usuario en la base de datos
    const user = await this.prisma.user.findUnique({
      where: {
        id: decoded.id
      }
    });

    if (!user) {
      return false;
    }

    // Verificar si el usuario es super admin
    if (user.isSuperAdmin) {
      return true;
    }

    const requiredModule = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    // Verificar si el usuario tiene el modulo requerido
    if (!requiredModule) {
      return false;
    }

    const userRol = await this.prisma.userRol.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!userRol) {
      return false;
    }

    const userModules = await this.rol.findById(userRol.rolId);

    if (!userModules) {
      return false;
    }
    // Buscar si el modulo que se requiere está en los modulos del usuario
    const moduleExists = userModules.rolPermissions.some(
      (module) => module.module.cod === requiredModule
    );
    if (!moduleExists) {
      return false;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    // Verificar si el modulo tiene permisos requeridos
    if (!requiredPermissions) {
      return false;
    }

    // Buscar si en ese modulo tiene los permisos requeridos
    const permissionsExists = userModules.rolPermissions.some((module) => {
      if (module.module.cod === requiredModule) {
        return requiredPermissions.every((permission) =>
          module.permissions.some((userPermission) => userPermission.cod === permission)
        );
      }
    });
    if (!permissionsExists) {
      return false;
    }

    return true;
  }
}
