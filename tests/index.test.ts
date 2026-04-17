import fsExtra from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

import { audit, lint, scaffold } from '../src/index';

describe('devforge-cli', () => {
  const tempRoot = path.join(os.tmpdir(), 'devforge-cli-tests');

  afterEach(async () => {
    await fsExtra.remove(tempRoot);
  });

  it('scaffolds an npm project', async () => {
    const result = await scaffold({
      type: 'npm',
      name: 'sample-package',
      outputDir: tempRoot
    });

    expect(result.success).toBe(true);
    expect(
      await fsExtra.pathExists(path.join(tempRoot, 'sample-package', 'src', 'index.ts'))
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
