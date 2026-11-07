import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// Add new subpaths to an already-tested package without rebuilding its base.
// Useful while a consumer pins an earlier compatible package containing fixes
// that have not yet reached the design-system default branch.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = resolve(process.argv[2] || ''), output = resolve(process.argv[3] || '');
assert(process.argv[2] && process.argv[3] && base !== output, 'Pass base.tgz and a different output.tgz.');
const run = promisify(execFile), digest = bytes => createHash('sha256').update(bytes).digest('hex');
const temporary = await mkdtemp(join(tmpdir(), 'domino-story-tools-'));
async function inventory(path, prefix = '') {
  const files = new Map();
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const relative = prefix + entry.name, absolute = join(path, entry.name);
    if (entry.isDirectory()) for (const [name, hash] of await inventory(absolute, relative + '/')) files.set(name, hash);
    else if (entry.isFile()) files.set(relative, digest(await readFile(absolute)));
  }
  return files;
}
try {
  const bundle = join(temporary, 'bundle'), declarations = join(temporary, 'types'), unpacked = join(temporary, 'package');
  await run('tar', ['-xzf', base, '-C', temporary]);
  const before = await inventory(unpacked);
  await build({ configFile: false, root, publicDir: false, logLevel: 'warn', plugins: [{ name: 'preserve-existing-domino-base', enforce: 'pre', resolveId(id, importer) { if (id === './components' && importer?.endsWith('/story-tools.tsx')) return { id: '@domlee/ui', external: true }; } }], build: { outDir: bundle, emptyOutDir: true, lib: { entry: join(root, 'src/lib/story-tools.tsx'), formats: ['es'], fileName: 'story-tools', cssFileName: 'story-tools' }, rolldownOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', '@domlee/ui'] } } });
  await run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--declaration', '--emitDeclarationOnly', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--jsx', 'react-jsx', '--skipLibCheck', '--outDir', declarations, join(root, 'src/lib/story-tools.tsx')], { maxBuffer: 2 * 1024 * 1024 });
  await cp(join(bundle, 'story-tools.js'), join(unpacked, 'lib/story-tools.js'));
  await cp(join(bundle, 'story-tools.css'), join(unpacked, 'lib/story-tools.css'));
  await cp(join(declarations, 'story-tools.d.ts'), join(unpacked, 'lib/lib/story-tools.d.ts'));
  await cp(join(root, 'docs/ACTION-MENUS.md'), join(unpacked, 'docs/ACTION-MENUS.md'));
  await cp(join(root, 'docs/STORY-TOOLS.md'), join(unpacked, 'docs/STORY-TOOLS.md'));
  const manifest = JSON.parse(await readFile(join(unpacked, 'package.json'), 'utf8'));
  manifest.exports['./story-tools'] = { types: './lib/lib/story-tools.d.ts', import: './lib/story-tools.js' };
  manifest.exports['./story-tools.css'] = './lib/story-tools.css';
  await writeFile(join(unpacked, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  const after = await inventory(unpacked);
  for (const [path, hash] of before) if (path !== 'package.json') assert.equal(after.get(path), hash, 'Existing package file changed: ' + path);
  await mkdir(dirname(output), { recursive: true });
  await run('tar', ['-czf', output, '-C', temporary, 'package']);
  const evidence = { baselinePackageSha256: digest(await readFile(base)), packageSha256: digest(await readFile(output)), preservedBaseFiles: before.size - 1, additions: ['lib/story-tools.js', 'lib/story-tools.css', 'lib/lib/story-tools.d.ts', 'docs/ACTION-MENUS.md', 'docs/STORY-TOOLS.md'], baseFilesByteIdentical: true };
  await writeFile(output + '.provenance.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence));
} finally { await rm(temporary, { recursive: true, force: true }); }
