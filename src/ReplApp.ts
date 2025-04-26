import 'reflect-metadata';
import * as repl from 'repl';
import * as fs from 'fs';
import chalk from 'chalk';
import {glob} from 'glob';
import Path from 'path';
import {pathToFileURL} from 'url';
import {
  CommandLineArgs,
  CommandLineArgsParser,
  ReplAppArgs,
} from './CommandLineArgsParser';

import {ReplAssert, assert} from './ReplAssert';
import {TestRunner} from './TestRunner';
import {ReplConfig} from './config/ReplConfig';
import {ReplUtil} from './ReplUtil';
import {ScriptPaths} from './Test';
import {ExtendedParseArgsOptionsConfig} from './ParseArgsOptionsConfig';
import columnify from 'columnify';
import {replArgsConfig} from './ReplArgsConfig';

interface LooseObject {
  [key: string]: unknown;
}

export type CallOnExitType = (args?: unknown) => void;

export class ReplApp {
  static replArgsConfig = replArgsConfig;

  /**
   * A static map that holds help descriptions for various commands.
   * The key is a string representing the command name, and the value is a string
   * containing the help description for that command.
   */
  static helpMap = new Map<string, string>();

  static callOnExit: CallOnExitType | undefined;

  /**
   * Starts the REPL application.
   *
   * @param initFilePaths - An array of file paths to initialize the REPL with.
   * @param argsConfig - Optional configuration for parsing command line arguments.
   * @param optionsDescription - Optional description of the available options.
   * @returns A promise that resolves to `true` if help text is shown, otherwise resolves to the result of starting the REPL or batch REPL.
   */
  static async start(
    initFilePaths: string[] = [],
    argsConfig?: ExtendedParseArgsOptionsConfig
  ) {
    argsConfig = ReplUtil.merge(argsConfig, ReplApp.replArgsConfig);

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
      ReplApp.showHelpText(argsConfig);
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
    optionDescriptions: ExtendedParseArgsOptionsConfig | undefined
  ) {
    console.log('Usage: repl-app [options]');
    console.log('\nOptions:');
    if (optionDescriptions) {
      const rows = Object.entries(optionDescriptions.options).map(
        ([option, config]) => ({
          Option: `--${option}`,
          Description: (config as {description?: string}).description || '',
        })
      );

      console.log(
        columnify(rows, {
          columnSplitter: '  ',
          config: {
            Option: {minWidth: 20},
            Description: {maxWidth: 60},
          },
        })
      );
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

    if (ReplApp.callOnExit) {
      ReplApp.callOnExit();
    }

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
      ReplApp.helpMap.set(k, ReplUtil.getHelpText(replServer.context[k]));
      // console.log(`${k}: `, ReplUtil.getHelpText(replServer.context[k]));
    });

    ReplApp.defineCustomCommands(replServer);
    if (ReplApp.callOnExit) {
      replServer.on('exit', ReplApp.callOnExit);
    }

    return [replServer];
  }

  public static defineCustomCommands(
    replServer: repl.REPLServer,
    imports: Map<string, repl.REPLCommand> = new Map()
  ) {
    replServer.defineCommand('lc', {
      help: 'List all available commands for automation',
      action() {
        console.log('Available commands: ');
        this.displayPrompt();
      },
    });

    replServer.defineCommand('clear', {
      help: 'Clear the screen',
      action() {
        process.stdout.write('\u001B[2J\u001B[0;0f');
        this.displayPrompt();
      },
    });

    imports.forEach((value, key) => {
      replServer.defineCommand(key, value);
    });
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
   * @param paths one or more file or folder paths
   * @returns a flat array of all files found
   */
  static getFiles(paths: string[]): ScriptPaths[] {
    const dirname = process.cwd();

    const files: ScriptPaths[] = paths.map(a => {
      let absoluteFilePath = Path.join(dirname, a);
      if (fs.existsSync(absoluteFilePath)) {
        const stats = fs.lstatSync(absoluteFilePath);
        if (stats.isFile()) {
          return [{fullPath: absoluteFilePath, shortPath: ''}];
        }

        if (stats.isDirectory()) {
          let globPattern = Path.resolve(
            Path.join(absoluteFilePath, '/**/*.js')
          );

          if (Path.sep !== '/') {
            globPattern = globPattern.replace(/\\/g, '/');
            absoluteFilePath = absoluteFilePath.replace(/\\/g, '/');
          }

          return glob.sync(globPattern).map(f => {
            return {
              fullPath: f,
              shortPath: Path.join(
                Path.basename(absoluteFilePath),
                f.replace(absoluteFilePath, '')
              ),
            };
          });
        }
      }

      // TODO: How do we inform the user when the file does not exist?
      console.log(`Did not find file or folder ${absoluteFilePath}`);
      return {fullPath: ''};
    }) as ScriptPaths[];

    return files.flat();
  }

  /**
   * Retrieves the help map for the REPL application.
   *
   * @returns {Map<string, string>} A map where the keys are command names and the values are their descriptions.
   */
  static getHelpMap() {
    return ReplApp.helpMap;
  }

  // TODO: pass an optional argument for retrieving hte help text.
  public static getCustomCommandsHelpText(arg?: string) {
    let helpText = '';
    // console.log('Custom Commands:', ReplApp.helpMap);
    if (!arg) {
      ReplApp.helpMap.forEach((value, key) => {
        if (value) {
          helpText += `${key.padEnd(15)}${value}\n`;
        }
      });
    } else {
      // TODO: Should also work for nested properties, e.g. `instance.variable`
      if (ReplApp.helpMap.has(arg)) {
        helpText += `${arg.padEnd(15)}${ReplApp.helpMap.get(arg)}\n`;
      } else {
        helpText += `No help available for ${arg}\n`;
      }
    }

    return helpText;
  }
}

export {
  ReplAppArgs,
  CommandLineArgsParser,
  CommandLineArgs,
  assert,
  ReplAssert,
  ReplUtil,
};
