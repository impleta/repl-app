import {parseArgs, ParseArgsConfig} from 'util';

/**
 * The type returned by parseArgs() is not exported, so a bit of hackery
 * from https://stackoverflow.com/a/41252607/6660206 to infer the type
 */
type ReturnType<T extends (...args: never[]) => never> = T extends (
  ...args: never[]
) => infer R
  ? R
  : never;
export type ParsedArgs = ReturnType<typeof parseArgs>;
export type ParsedArgsValues = ParsedArgs['values'];

export type ReplAppArgs = {
  initFilePaths: string[];
  scriptPaths: string[];
  scriptArgs: {[key: string]: unknown};
  parsedArgs: ParsedArgs;
};
/**
 * This is to assist with auto completion (by making this available in the .d.ts file generated with @types)
 */
export let CommandLineArgs: ReplAppArgs;

/**
 * 
 */
export class CommandLineArgsParser {
  private static parsedArgs: ReplAppArgs;

  static getArgs(argsConfig: ParseArgsConfig = {}) {
    // Only parse once per session.
    // May need to provide the ability to optionally force reparsing.
    if (CommandLineArgsParser.parsedArgs) {
      return CommandLineArgsParser.parsedArgs;
    }

    // tokens, allowPositionals, and strict are intentionally
    // hard-coded here, overriding any derived REPL's argsConfig.
    argsConfig = {
      ...argsConfig,
      tokens: true,
      allowPositionals: true,
      strict: false,
    };

    const parsedArgs = CommandLineArgsParser.extractScriptArgs(
      parseArgs(argsConfig)
    );

    CommandLineArgsParser.parsedArgs = {
      initFilePaths: parsedArgs.values['initFile'] as string[],
      scriptPaths: parsedArgs.positionals,
      scriptArgs: parsedArgs.scriptArgs,
      parsedArgs: parsedArgs,
    };

    CommandLineArgs = CommandLineArgsParser.parsedArgs;

    return CommandLineArgs;
  }

  static extractScriptArgs(parsedArgs: ParsedArgs) {

    const scriptArgs: typeof parsedArgs.values = {};

    const optionTerminatorIndex = parsedArgs.tokens?.find(
      t => t.kind === 'option-terminator'
    )?.index;

    if (!optionTerminatorIndex) {
      return {...parsedArgs, scriptArgs: scriptArgs};
    }
    const positionalsAfterTerminator = parsedArgs
      .tokens!.filter(t => t.index > optionTerminatorIndex)
      .map(t => (t.kind === 'positional' ? t.value : ''))
      .filter(p => p !== '');

    if (
      !positionalsAfterTerminator ||
      positionalsAfterTerminator.length === 0
    ) {
      return {...parsedArgs, scriptArgs: scriptArgs};
    }

    for (let i = 0; i < positionalsAfterTerminator.length; i++) {
      const p = positionalsAfterTerminator[i];

      scriptArgs[p.replace(/^--/, '')] = positionalsAfterTerminator[i + 1];
      i++;
    }

    const remove = (arr: string[], func: (a: string) => boolean) =>
      Array.isArray(arr)
        ? arr.filter(func).reduce((acc: string[], val) => {
            arr.splice(arr.indexOf(val), 1);
            return acc.concat(val);
          }, [])
        : [];

    positionalsAfterTerminator.reverse().forEach(p => {
      remove(parsedArgs.positionals, (op: string) => p === op);
    });

    return {...parsedArgs, scriptArgs: scriptArgs};
  }
}
