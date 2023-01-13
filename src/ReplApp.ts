import * as repl  from 'repl';
import * as fs from 'fs';
import * as stream from 'stream';

interface LooseObject {
  [key:string]:any
}

export class ReplApp {
  
  static async start() {
    const initFileContents:LooseObject =  await ReplApp.getInitFileContents('./ReplApp.init.js');
    const replContext = ReplApp.getContext();

    const replServer = repl.start(replContext);

    Object.keys(initFileContents).forEach(k => {
      replServer.context[k] = initFileContents[k];  
    });
  }

  static async getInitFileContents(initFileName: string) {

    let initFileContents = {};

    try {
      initFileContents =  await import(initFileName);
    } catch(err) {
      console.log(String(err));
    }

    return initFileContents;
  }

  static getContext() {
    const args = process.argv.slice(2);

    let replicantContext = {ignoreUndefined:true};

    if (args.length > 0) {
      const inputStream = fs.createReadStream(args[0]);

      const outputStream = new stream.PassThrough();
      outputStream.setEncoding('utf-8');
      outputStream.on('data', (chunk) => {
        console.log(chunk);
      })

      Object.assign(replicantContext, 
        {
          input: inputStream, 
          output: outputStream,
          prompt: "",
        });
    }

    return replicantContext;
  }
}
