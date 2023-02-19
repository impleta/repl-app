import * as repl from 'repl';
import {ScriptMode} from './ScriptMode';

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
    replServer.context.ClearRepl = () => replServer.emit('reset');

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

    const replContext = {ignoreUndefined: true};

    // If there are args, then we're in batch mode
    if (args.length > 0) {
      Object.assign(replContext, ScriptMode.getBatchContext(args));
    }

    return replContext;
  }
}
