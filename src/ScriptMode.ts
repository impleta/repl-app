import * as repl from 'repl';
import * as fs from 'fs';
import Path from 'path';
import glob from 'glob';
import {EOL} from 'os';
import {Transform} from 'stream';

export type ScriptModeReplOptions = {
  consoleLog?: (arg: unknown) => void;
} & repl.ReplOptions;

export class ScriptMode {
  static prompt = 'input>';

  static stdoutHasBeenSetup = false;

  /**
   * Returns the options for running the REPL in script mode.
   * @param filePath A string representing a paths for a script file
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
    const files = paths.map(a => {
      if (fs.existsSync(a)) {
        const stats = fs.lstatSync(a);
        if (stats.isFile()) {
          return a;
        }

        if (stats.isDirectory()) {
          let globPattern = Path.resolve(Path.join(a, '/**/*.js'));

          if (Path.sep !== '/') {
            globPattern = globPattern.replace(/\\/g, '/');
          }

          return glob.sync(globPattern);
        }
      }

      // TODO: How do we inform the user when the file does not exist?
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

    // Source code is determined to be any line follwing the prompt.
    // If the chunk paramter below matches the prompt, then nothing is
    // written to the stdout until an EOL is detected.
    process.stdout.write = (
      chunk: Uint8Array | string,
      encoding?: undefined,
      callback?: (err?: Error) => void
    ) => {
      if (chunk === ScriptMode.prompt) {
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
