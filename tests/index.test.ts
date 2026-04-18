import fsExtra from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

import { audit, lint, scaffold } from '../src/index';

describe('devforge-cli', () => {
  const tempRoot = path.join(os.tmpdir(), 'devforge-cli-tests');

  afterEach(async () => {
    await fsExtra.remove(tempRoot);
  });

  it('scaffolds a react project', async () => {
    const result = await scaffold({
      type: 'react',
      name: 'sample-react-app',
      outputDir: tempRoot
    });

    expect(result.success).toBe(true);
    expect(
      await fsExtra.pathExists(path.join(tempRoot, 'sample-react-app', 'src', 'main.tsx'))
    ).toBe(true);
  });

  it('scaffolds a nextjs app structure', async () => {
    const result = await scaffold({
      type: 'nextjs',
      name: 'sample-next-app',
      outputDir: tempRoot
    });

    expect(result.success).toBe(true);
    expect(
      await fsExtra.pathExists(path.join(tempRoot, 'sample-next-app', 'app', 'page.tsx'))
    ).toBe(true);
    expect(
      await fsExtra.pathExists(
        path.join(tempRoot, 'sample-next-app', 'components', 'ui', 'page-shell.tsx')
      )
    ).toBe(true);
  });

  it('scaffolds a nest server with prisma and auth files', async () => {
    const result = await scaffold({
      type: 'nest-js-server',
      name: 'sample-api',
      outputDir: tempRoot,
      orm: 'prisma',
      database: 'postgresql',
      authProvider: 'google'
    });

    expect(result.success).toBe(true);
    expect(
      await fsExtra.pathExists(path.join(tempRoot, 'sample-api', 'prisma', 'schema.prisma'))
    ).toBe(true);
    expect(
      await fsExtra.pathExists(path.join(tempRoot, 'sample-api', 'src', 'auth', 'oauth.provider.ts'))
    ).toBe(true);
  });

  it('reports missing package.json during lint', async () => {
    const result = await lint({ dir: tempRoot });

    expect(result.success).toBe(false);
  });

  it('counts dependencies during audit', async () => {
    await fsExtra.ensureDir(tempRoot);
    await fsExtra.writeJson(path.join(tempRoot, 'package.json'), {
      dependencies: { chalk: '^5.3.0' },
      devDependencies: { typescript: '^5.4.5' }
    });

    const result = await audit({ dir: tempRoot });

    expect(result.success).toBe(true);
    expect(result.message).toContain('2 dependencies');
  });
});
