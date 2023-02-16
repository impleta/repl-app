import * as repl from 'repl';
import * as fs from 'fs';
import * as stream from 'stream';

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

  static getContext() {
    const args = process.argv.slice(2);

    const replicantContext = {ignoreUndefined: true};

    // If there are args, then we're in batch mode
    if (args.length > 0) {
      Object.assign(replicantContext, ReplApp.getBatchContext(args[0]));
    }

    return replicantContext;
  }
  static getBatchContext(fileName: string): any {
    const inputStream = fs.createReadStream(fileName);

    const outputStream = new stream.PassThrough();
    outputStream.setEncoding('utf-8');
    outputStream.on('data', chunk => {
      console.log(chunk);
    });

    return {
      input: inputStream,
      output: outputStream,
      prompt: '',
    };
  }
}
