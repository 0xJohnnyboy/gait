import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const packages = ['core', 'browser', 'schema', 'testing', 'react', 'vue', 'svelte', 'angular'];

function runTsc(packageName, module, outDir) {
  const packageRoot = join(root, 'packages', packageName);
  const configPath = join(root, '.gait-build', `${packageName}-${module}.json`);
  const compilerOptions = {
    target: 'ES2022',
    module,
    moduleResolution: module === 'ESNext' ? 'Bundler' : 'Node',
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    noImplicitReturns: true,
    verbatimModuleSyntax: module === 'ESNext',
    isolatedModules: true,
    declaration: module === 'ESNext',
    declarationMap: false,
    rootDir: join(packageRoot, 'src'),
    outDir,
    allowImportingTsExtensions: false,
    rewriteRelativeImportExtensions: true,
    ignoreDeprecations: '6.0',
    lib: packageName === 'browser' ? ['ES2022', 'DOM'] : ['ES2022'],
    paths: packageName === 'core' ? undefined : { '@gait/core': ['packages/core/dist/index.d.ts'] },
    baseUrl: root,
  };
  const config = {
    compilerOptions,
    include: [join(packageRoot, 'src', '**', '*.ts'), join(packageRoot, 'src', '**', '*.d.ts')],
  };
  mkdirSync(join(root, '.gait-build'), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  const result = spawnSync('pnpm', ['exec', 'tsc', '-p', configPath], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Build failed for ${packageName} (${module})`);
}

function copyCjsFiles(sourceRoot, targetRoot) {
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    const source = join(sourceRoot, entry.name);
    if (entry.isDirectory()) {
      copyCjsFiles(source, join(targetRoot, entry.name));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    mkdirSync(targetRoot, { recursive: true });
    const target = join(targetRoot, entry.name.replace(/\.js$/, '.cjs'));
    const content = readFileSync(source, 'utf8').replaceAll('.js"', '.cjs"').replaceAll(".js'", ".cjs'");
    writeFileSync(target, content);
  }
}

rmSync(join(root, '.gait-build'), { recursive: true, force: true });
for (const packageName of packages) {
  const packageRoot = join(root, 'packages', packageName);
  rmSync(join(packageRoot, 'dist'), { recursive: true, force: true });
  rmSync(join(packageRoot, 'dist-cjs'), { recursive: true, force: true });
  runTsc(packageName, 'ESNext', join(packageRoot, 'dist'));
}
for (const packageName of packages) {
  const packageRoot = join(root, 'packages', packageName);
  runTsc(packageName, 'CommonJS', join(packageRoot, 'dist-cjs'));
  copyCjsFiles(join(packageRoot, 'dist-cjs'), join(packageRoot, 'dist'));
}
rmSync(join(root, '.gait-build'), { recursive: true, force: true });
