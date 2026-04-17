#!/usr/bin/env node

const { runCli } = require('../dist/cli.cjs');

runCli(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});
