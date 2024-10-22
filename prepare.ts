// scripts/prepare.js
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { execSync } = require('child_process');
  execSync('husky install', { stdio: 'inherit' });
}
