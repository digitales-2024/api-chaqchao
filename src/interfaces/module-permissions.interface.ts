export interface ModulePermissions {
  moduleId: string;
  permissionIds: string[];
}

export interface ModulePermissionsData {
  module: {
    id: string;
    name: string;
  };
  permissions: {
    id: string;
    name: string;
  }[];
}
