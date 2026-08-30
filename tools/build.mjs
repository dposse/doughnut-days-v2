/* Rebuilds every generated page.
 *
 *   node tools/build.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
for (const script of ['build-maps.mjs', 'build-blog.mjs', 'build-contact.mjs']) {
  console.log(`\n--- ${script} ---`);
  const r = spawnSync(process.execPath, [join(HERE, script)], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
