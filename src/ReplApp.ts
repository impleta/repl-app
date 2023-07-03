import * as repl from 'repl';
import * as fs from 'fs';
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
    argsConfig?: ParseArgsConfig,
    optionsDescription?: {[option: string]: string}
  ): Promise<repl.REPLServer[]> {
    const replAppArgs = CommandLineArgsParser.getArgs(argsConfig);

    if (replAppArgs.initFilePaths) {
      initFilePaths.push(...replAppArgs.initFilePaths);
    }

    let repls: repl.REPLServer[] = [];

    if (replAppArgs.parsedArgs.values['help'] as string) {
      ReplApp.showHelpText(optionsDescription);
      return repls;
    }
    let initFileContents: LooseObject = {};

    const contents = await Promise.all(
      initFilePaths.map(async p => await ReplApp.getInitFileContents(p))
    );

    initFileContents = Object.assign(
      {CommandLineArgs: replAppArgs},
      ...contents
    );

    const replContext = ReplApp.getContext();


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

  static showHelpText(
    optionDescriptions: {[option: string]: string} | undefined
  ) {
    if (optionDescriptions) {
      Object.entries(optionDescriptions).forEach(([option, description]) => {
        console.log(`  --${option}\t${description}`);
      });
    }
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
    // converts a path to its file URL equivalent, after first
    // converting to absolute if needed
    const getAbsolutePathFileURL = (p: string) => {
      if (Path.isAbsolute(p)) {
        return pathToFileURL(p).href;
      }

      const __dirname = pathToFileURL(process.cwd()).href;
      return Path.join(__dirname, p);
    };

    initFileName = getAbsolutePathFileURL(initFileName);

    let initFileContents = {};

    try {
      initFileContents = await import(initFileName);
    } catch (err) {
      console.log(`Error importing init file: ${initFileName}: ${err}`);
    }

    return initFileContents;
  }

  static getContext(): repl.ReplOptions {
    const replContext = {ignoreUndefined: true};
    return replContext;
  }

  static getJSONFileContentsAsObject(jsonFileName: string) {
    // TODO: For now, cannot use dynamic imports with JSON files without the experimental switch,
    // TODO: so simply read the file and deserialize. Can later merge with the getInitFileContents
    // TODO: code above once the switch is no longer needed
    const path = ReplApp.getAbsolutePath(jsonFileName);
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  }

  static getAbsolutePath(p: string) {
    if (Path.isAbsolute(p)) {
      return p;
    }

    const __dirname = process.cwd();
    return Path.join(__dirname, p);
  }
}

export {ReplAppArgs, CommandLineArgsParser};
