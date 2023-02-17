import * as repl from 'repl';
import * as fs from 'fs';
import * as stream from 'stream';
import { EOL } from 'os';

interface LooseObject {
  [key: string]: unknown;
}

export class ReplApp {

  static async start(initFilePath = './ReplApp.init.js') {
    const initFileContents: LooseObject = await ReplApp.getInitFileContents(
      initFilePath
    );
    const replContext = ReplApp.getContext();

    const replServer = repl.start(replContext);

    Object.keys(initFileContents).forEach(k => {
      replServer.context[k] = initFileContents[k];
    });
  }

  static async getInitFileContents(initFileName: string) {
    let initFileContents = {};

    initFileContents = await import(initFileName);

    return initFileContents;
  }

  static getContext(): repl.ReplOptions {
    const args = process.argv.slice(2);

    const replicantContext = {ignoreUndefined: true};

    // If there are args, then we're in batch mode
    if (args.length > 0) {
      Object.assign(replicantContext, ReplApp.getBatchContext(args[0]));
    }

    return replicantContext;
  }

  static getBatchContext(fileName: string): repl.ReplOptions {
    const inputStream = fs.createReadStream(fileName);

    // TODO: Provide an override for this so we can optionally see the source
    ReplApp.setupStdout();

    return {
      input: inputStream,
      output: process.stdout,
      prompt: 'input>',
    };
  }

  /**
   * Overwrites process.stdout.write so that source code is not autmatically printed to screen.
   */
  static setupStdout() {
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);

    let isSourceLine = false;

    process.stdout.write = (
      chunk: Uint8Array | string,
      encoding?: undefined,
      callback?: (err?: Error) => void
    ) => {
      if (chunk === 'input>') {
        chunk = '';
        isSourceLine = true;
      } else if (chunk === EOL) {
        chunk = '';
        isSourceLine = false;
      } else if (isSourceLine) {
        chunk = '';
      }

      return originalStdoutWrite(chunk, encoding, callback);
    };
  }
}
