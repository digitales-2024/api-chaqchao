import { execSync } from 'child_process';
// scripts/prepare.js
if (process.env.NODE_ENV !== 'production') {
  execSync('husky install', { stdio: 'inherit' });
}
