import 'reflect-metadata';
import * as repl from 'repl';
import * as fs from 'fs';
import chalk from 'chalk';
import glob from 'glob';
import Path from 'path';
import {pathToFileURL} from 'url';
import {CommandLineArgs, CommandLineArgsParser, ReplAppArgs} from './CommandLineArgsParser';
import {ParseArgsConfig} from 'util';
import {ReplAssert, assert} from './ReplAssert';
import {TestRunner} from './TestRunner';
import {ReplConfig} from './config/ReplConfig';
import { ReplUtil } from './ReplUtil';

export {ReplUtil} from './ReplUtil';

interface LooseObject {
  [key: string]: unknown;
}

export class ReplApp {
  static replArgsConfig: ParseArgsConfig = {
    options: {
      initFile: {
        type: 'string',
        multiple: true,
      },
      configFile: {
        type: 'string',
      },
      'report.generate': {
        type: 'boolean',
      },
      'report.folder': {
        type: 'string',
      },
      'report.filePath': {
        type: 'string',
      },
      'get-config': {
        type: 'string',
      },
      'set-config': {
        type: 'string',
      },
    },
  };

  static imports = new Map();

  static async start(
    initFilePaths: string[] = [],
    argsConfig?: ParseArgsConfig,
    optionsDescription?: {[option: string]: string}
  ) {
    argsConfig = ReplUtil.merge(
      argsConfig,
      ReplApp.replArgsConfig,
    );

    const cmdLineArgs = CommandLineArgsParser.getArgs(argsConfig);

    if (ReplConfig.handleConfigOperation(cmdLineArgs.parsedArgs.values)) {
      return;
    }

    const config = ReplConfig.getConfig(cmdLineArgs.parsedArgs.values);

    if (config.initFiles) {
      initFilePaths.push(...(config.initFiles as []));
    }

    // TODO: This belongs in the actual repls, not in repl-app
    if (cmdLineArgs.parsedArgs.values['help'] as string) {
      ReplApp.showHelpText(optionsDescription);
      return true;
    }

    const contents = await Promise.all(
      initFilePaths.map(async p => await ReplApp.getInitFileContents(p))
    );

    const initFileContents = Object.assign({}, ...contents);

    const replContext = ReplApp.getContext();

    if (cmdLineArgs.scriptPaths.length === 0) {
      return ReplApp.startRepl(replContext, initFileContents);
    } else {
      return await ReplApp.startBatchRepl(
        replContext,
        initFileContents,
        cmdLineArgs
      );
    }
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

  static async startBatchRepl(
    replContext: repl.ReplOptions,
    initFileContents: LooseObject,
    args: ReplAppArgs
  ) {
    const files = ReplApp.getFiles(args.scriptPaths);
    const runner = new TestRunner(files, initFileContents);
    const result = await runner.run();

    if (result.succeeded) {
      console.log(chalk.yellow('All tests succeeded!'));
    } else {
      console.log(chalk.red('One or more tests failed'));
    }

    if (result.resultsFile) {
      console.log(chalk.green(`Results saved to ${result.resultsFile}`));
    }

    return result;
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

  /**
   * Returns a flat array of all descendant files of the specified paths.
   * TODO: Look for specific extensions like '.js' and '.ts' only.
   * @param paths one or more file or folder paths
   * @returns a flat array of all files found
   */
  static getFiles(paths: string[]) {
    const __dirname = process.cwd();

    const files = paths.map(a => {
      const absoluteFilePath = Path.join(__dirname, a);
      if (fs.existsSync(absoluteFilePath)) {
        const stats = fs.lstatSync(absoluteFilePath);
        if (stats.isFile()) {
          return absoluteFilePath;
        }

        if (stats.isDirectory()) {
          let globPattern = Path.resolve(
            Path.join(absoluteFilePath, '/**/*.js')
          );

          if (Path.sep !== '/') {
            globPattern = globPattern.replace(/\\/g, '/');
          }

          return glob.sync(globPattern);
        }
      }

      // TODO: How do we inform the user when the file does not exist?
      console.log(`did not find file or folder ${absoluteFilePath}`);
      return null;
    }) as string[];

    return files.flat();
  }
}
export {ReplAppArgs, CommandLineArgsParser, CommandLineArgs, assert, ReplAssert};
