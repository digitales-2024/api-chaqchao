export interface ModulePermissions {
  moduleId: string;
  permissionIds: string[];
}

export interface ModulePermissionsData {
  module: {
    id: string;
    cod: string;
    name: string;
    description: string;
  };
  permissions: {
    id: string;
    cod: string;
    name: string;
    description: string;
  }[];
}
