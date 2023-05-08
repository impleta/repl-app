import {parseArgs, ParseArgsConfig} from 'util';

export class CommandLineArgsParser {
  static argsConfig: ParseArgsConfig = {
    options: {
      ra_initfile: {
        type: 'string',
        multiple: true,
      },
    },
    allowPositionals: true,
    strict: true,
  };

  static getArgs() {
    return parseArgs(CommandLineArgsParser.argsConfig);
  }
}
