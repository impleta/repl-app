import {parseArgs, ParseArgsConfig} from 'util';

export class CommandLineArgsParser {
  static argsConfig: ParseArgsConfig = {
    options: {
      ra_module: {
        type: 'string',
        multiple: true,
      },
    },
    allowPositionals: true,
    strict: true,
  };

  static getArgs() {
    try {
      return parseArgs(CommandLineArgsParser.argsConfig);
    } catch (err) {
      console.log(err);
    }

    return undefined;
  }
}
