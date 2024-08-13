export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  token?: string;
  rol?: string;
  lastLogin?: Date;
  isActive?: boolean;
}
