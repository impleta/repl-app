import * as repl from 'repl';
import Path from 'path';
import {ScriptMode} from './ScriptMode';
import {pathToFileURL} from 'url';
import {CommandLineArgsParser, ReplAppArgs} from './CommandLineArgsParser';
import {ParseArgsConfig} from 'util';

interface LooseObject {
  [key: string]: unknown;
}

export class ReplApp {
  static replAppArgs: ReplAppArgs;

  static async start(
    initFilePaths: string[] = [],
    argsConfig?: ParseArgsConfig
  ): Promise<repl.REPLServer[]> {
    const replAppArgs = CommandLineArgsParser.getArgs(argsConfig);

    if (replAppArgs.initFilePaths) {
      initFilePaths.push(...replAppArgs.initFilePaths);
    }

    let initFileContents: LooseObject = {};

    // returns a path to its file URL equivalent, after first
    // converting to absolute if needed
    const getAbsolutePathFileURL = (p: string) => {
      if (Path.isAbsolute(p)) {
        return pathToFileURL(p).href;
      }

      const __dirname = pathToFileURL(process.cwd()).href;
      return Path.join(__dirname, p);
    };

    const contents = await Promise.all(
      initFilePaths.map(
        async p => await ReplApp.getInitFileContents(getAbsolutePathFileURL(p))
      )
    );

    initFileContents = Object.assign(
      {CommandLineArgs: replAppArgs},
      ...contents
    );

    const replContext = ReplApp.getContext();

    let repls: repl.REPLServer[];

    if (replAppArgs.scriptPaths.length === 0) {
      repls = ReplApp.startRepl(replContext, initFileContents);
    } else {
      repls = ReplApp.startBatchRepl(
        replContext,
        initFileContents,
        replAppArgs.scriptPaths
      );
    }

    return repls;
  }

  static startBatchRepl(
    replContext: repl.ReplOptions,
    initFileContents: LooseObject,
    args: string[]
  ) {
    const files = ScriptMode.getFiles(args);
    const repls: repl.REPLServer[] = [];

    files.forEach(f => {
      Object.assign(replContext, ScriptMode.getContext(f));
      repls.push(...ReplApp.startRepl(replContext, initFileContents));
    });

    return repls;
  }

  static startRepl(
    replContext: repl.ReplOptions,
    initFileContents: LooseObject
  ) {
    const replServer = repl.start(replContext);
    Object.keys(initFileContents).forEach(k => {
      replServer.context[k] = initFileContents[k];
    });

    return [replServer];
  }

  static async getInitFileContents(initFileName: string): Promise<LooseObject> {
    let initFileContents = {};

    try {
      initFileContents = await import(initFileName);
    } catch (err) {
      console.log(`Error importing init file: ${initFileName}`);
    }

    return initFileContents;
  }

  static getContext(): repl.ReplOptions {
    const replContext = {ignoreUndefined: true};
    return replContext;
  }
}

export {ReplAppArgs};
