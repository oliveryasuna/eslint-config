import process from 'node:process';
import {GENERATORS} from './_generators';
import {isEntrypoint, parseMode, report, runGenerators} from './_shared';

const generateAll = (async(mode = parseMode()): Promise<number> => report((await runGenerators(GENERATORS, mode)), mode));

if(isEntrypoint(import.meta.url)) {
  process.exitCode = (await generateAll());
}

export {
  generateAll
};
