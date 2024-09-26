import { Permission } from 'src/interfaces';

// Permisos generales CRUD
export const permissionsSeed: Permission[] = [
  {
    cod: 'CREATE',
    name: 'create',
    description: 'Create'
  },
  {
    cod: 'UPDATE',
    name: 'update',
    description: 'Update'
  },
  {
    cod: 'DELETE',
    name: 'delete',
    description: 'Delete'
  },
  {
    cod: 'READ',
    name: 'read',
    description: 'Read'
  },
  {
    cod: 'LIST',
    name: 'list',
    description: 'List'
  },
  {
    cod: 'PRD-EXPORT',
    name: 'export',
    description: 'Export'
  }
];
