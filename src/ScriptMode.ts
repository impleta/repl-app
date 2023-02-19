import * as repl from 'repl';
import * as fs from 'fs';
import {EOL} from 'os';
import MultiStream from 'multistream';
import {Stream, Readable} from 'stream';

export class ScriptMode {
  /**
   * Returns the options for running the REPL in script mode.
   * @param oneOrMorePaths A string or an array of strings representing one or more paths of files or folders
   * @returns Options for running the REPL in script mode
   */
  static getBatchContext(oneOrMorePaths: string[] | string): repl.ReplOptions {

    const inputStream = ScriptMode.getInputStream(oneOrMorePaths);

    // TODO: Provide an override for this so we can optionally see the source
    ScriptMode.setupStdout();

    return {
      input: inputStream,
      output: process.stdout,
      prompt: 'input>',
    };
  }

  static getInputStream(oneOrMorePaths: string | string[]) {
    let paths: string[] = [];
    paths = paths.concat(oneOrMorePaths);

    const clearStream = new Readable();
    clearStream.push('.clear');
    clearStream.push(null);

    let streams = paths.map(p => fs.createReadStream(p));
    streams = streams
      .reduce(
        (res: fs.ReadStream[], item) =>
          res.concat(item, clearStream as fs.ReadStream),
        []
      )
      .slice(0, -1);
    const inputStream = new Stream.PassThrough();
    new MultiStream(streams).pipe(inputStream);

    return inputStream;
  }

  /**
   * Overwrites process.stdout.write so that source code is not autmatically printed to screen.
   */
  static setupStdout() {
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);

    let isSourceLine = false;

    process.stdout.write = (
      chunk: Uint8Array | string,
      encoding?: undefined,
      callback?: (err?: Error) => void
    ) => {
      if (chunk === 'input>') {
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
