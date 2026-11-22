import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), '../landing-dist');
const source = resolve(dist, 'landing.html');
const target = resolve(dist, 'index.html');

if (!existsSync(source)) {
  throw new Error('landing.html introuvable dans landing-dist');
}
copyFileSync(source, target);
console.log('landing.html -> index.html');
