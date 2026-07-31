import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

module.exports = () => {
  const backendRoot = path.join(__dirname, '..');
  const dbPath = path.join(backendRoot, 'prisma', 'test.db');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const env = { ...process.env, DATABASE_URL: 'file:./test.db' };

  execSync('npx prisma migrate deploy', { cwd: backendRoot, env, stdio: 'inherit' });
  execSync('npx prisma db seed', { cwd: backendRoot, env, stdio: 'inherit' });
};
