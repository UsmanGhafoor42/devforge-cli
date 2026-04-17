const external = [
  'chalk',
  'commander',
  'enquirer',
  'fs',
  'fs-extra',
  'node:fs',
  'node:path',
  'ora',
  'path'
];

module.exports = [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      }
    ],
    external
  },
  {
    input: 'dist/esm/cli.js',
    output: {
      file: 'dist/cli.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    external
  }
];
