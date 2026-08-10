import process from 'node:process';
import {GENERATORS} from './_generators';
import {report, runGenerators} from './_shared';

const exitCode = report((await runGenerators(GENERATORS, 'check')), 'check');

if(exitCode === 0) {
  process.stderr.write('\nAll generated files are up to date\n');
}

process.exitCode = exitCode;
