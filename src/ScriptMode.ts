import * as repl from 'repl';
import * as fs from 'fs';
import Path from 'path';
import glob from 'glob';
import {fileURLToPath} from 'url';

import {EOL} from 'os';
import {Transform} from 'stream';

export type ScriptModeReplOptions = {
  consoleLog?: (arg: unknown) => void;
} & repl.ReplOptions;

export class ScriptMode {
  static prompt = 'input>';
  static continuePrompt = '... ';

  static stdoutHasBeenSetup = false;

  /**
   * Returns the options for running the REPL in script mode.
   * @param filePath A string representing a path for a script file
   * @returns Options for running the REPL in script mode
   */
  static getContext(filePath: string) {
    const inputStream = ScriptMode.getInputStream(filePath);

    // TODO: Provide an override for this so we can optionally see the source
    ScriptMode.setupStdout();

    return {
      input: inputStream,
      output: process.stdout,
      prompt: ScriptMode.prompt,
    };
  }

  /**
   * Returns a readable stream with the specified file's contents. 
   * Adds a newline at the end, as otherwise the last line of the file isn't
   * processed.
   * @param filePath The file path
   * @returns A readable stream of the file's contents
   */
  static getInputStream(filePath: string) {
    const inputStream = fs.createReadStream(filePath);

    const appendNewline = new Transform({
      writableObjectMode: true,
      transform(chunk, encoding, callback) {
        this.push(chunk, encoding);
        callback();
      },
      flush(callback) {
        this.push('\n');
        callback();
      },
    });

    return inputStream.pipe(appendNewline);
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

  /**
   * Overwrites process.stdout.write so that source code is not autmatically printed to screen.
   */
  static setupStdout() {
    if (ScriptMode.stdoutHasBeenSetup) {
      return;
    }
    ScriptMode.stdoutHasBeenSetup = true;

    const originalStdoutWrite = process.stdout.write.bind(process.stdout);

    let isSourceLine = false;

    process.stdout.write = (
      chunk: string,
      encoding?: undefined,
      callback?: (err?: Error) => void
    ) => {
      if ([ScriptMode.prompt, ScriptMode.continuePrompt].includes(chunk)) {
        // Source code is determined to be any line follwing the prompt or continuePrompt.
        // Do not write to stdout until an EOL is detected.
        chunk = '';
        isSourceLine = true;
      } else if (chunk === EOL) {
        chunk = '';
        isSourceLine = false;
      } else if (isSourceLine) {
        chunk = '';
      // } else if (chunk.includes('\u001b[32m')) {
      } else if ((chunk.match(/^\x1b\[32m/g) || []).length === 1) {
        /**
         * Not pretty, but this prevents lines like 'a = 5' causing console output.
         * let a = 5 // causes no output
         * a = 5 // causes 5 to be printed to screen.
         * This check prevents that by looking at strings starting with a specific
         * color code on the console.
         * This is very brittle, and we should figure out a better way to prevent 
         * spurious output.
         * */
        chunk = '';
      }

      // Uncomment the following for debugging purposes.
      // fs.appendFileSync('./outlog.txt', chunk + '::');

      return originalStdoutWrite(chunk, encoding, callback);
    };
  }
}
