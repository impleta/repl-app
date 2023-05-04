import * as repl from 'repl';
import Path from 'path';
import {ScriptMode} from './ScriptMode';
import {pathToFileURL, fileURLToPath} from 'url';

interface LooseObject {
  [key: string]: unknown;
}

export type ReplAppParams = {
  initFilePaths: string[];
  scriptPaths: string[];
};

export class ReplApp {
  static async start(params: ReplAppParams) {

    let initFilePaths = params.initFilePaths;

    if (!initFilePaths || initFilePaths.length === 0) {
      const currentPath = Path.dirname(fileURLToPath(import.meta.url));
      initFilePaths = [Path.join(currentPath, './ReplApp.init.js')];
    }

    let initFileContents: LooseObject = {};

    const getAbsolutePath = (p: string) => {
      if (Path.isAbsolute(p)) {
        return pathToFileURL(p).href;
      }

      const __dirname = pathToFileURL(process.cwd()).href;
      return Path.join(__dirname, p);
    };

    const contents = await Promise.all(
      initFilePaths.map(
        async p => await ReplApp.getInitFileContents(getAbsolutePath(p))
      )
    );

    initFileContents = Object.assign({}, ...contents);

    const replContext = ReplApp.getContext();

    if (params.scriptPaths.length === 0) {
      ReplApp.startRepl(replContext, initFileContents);
    } else {
      ReplApp.startBatchRepl(replContext, initFileContents, params.scriptPaths);
    }
  }

  static async start2(initFilePath = './ReplApp.init.js') {
    const initFileContents: LooseObject = await ReplApp.getInitFileContents(
      initFilePath
    );

    const args = process.argv.slice(2);

    const replContext = ReplApp.getContext();

    if (args.length === 0) {
      ReplApp.startRepl(replContext, initFileContents);
    } else {
      ReplApp.startBatchRepl(replContext, initFileContents, args);
    }
  }

  static startBatchRepl(
    replContext: repl.ReplOptions,
    initFileContents: LooseObject,
    args: string[]
  ) {
    const files = ScriptMode.getFiles(args);
    files.forEach(f => {
      Object.assign(replContext, ScriptMode.getContext(f));
      ReplApp.startRepl(replContext, initFileContents);
    });
  }

  static startRepl(
    replContext: repl.ReplOptions,
    initFileContents: LooseObject
  ) {
    const replServer = repl.start(replContext);
    Object.keys(initFileContents).forEach(k => {
      replServer.context[k] = initFileContents[k];
    });

    return replServer;
  }

  static async getInitFileContents(initFileName: string): Promise<LooseObject> {
    let initFileContents = {};

    initFileContents = await import(initFileName);

    return initFileContents;
  }

  static getContext(): repl.ReplOptions {
    const replContext = {ignoreUndefined: true};
    return replContext;
  }
}
