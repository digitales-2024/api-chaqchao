import { ModuleData } from './module.interface';
import { PermissionData } from './permission.interface';

export interface ModulePermissions {
  moduleId: string;
  permissionIds: string[];
}

export interface ModulePermissionsData {
  module: ModuleData;
  permissions: PermissionData[];
}
