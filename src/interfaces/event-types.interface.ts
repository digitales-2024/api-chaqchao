export interface EventPayloads {
  'user.welcome-admin-first': { name: string; email: string; password: string };
  'user.reset-password': { name: string; email: string; link: string };
  'user.verify-email': { name: string; email: string; otp: string };
}