import * as fs from 'fs';
import {fileURLToPath} from 'url';
import Path from 'path';
import chalk from 'chalk';

/**
 * A utility class for various REPL (Read-Eval-Print Loop) operations.
 */
export class ReplUtil {

  /**
   * Converts an import meta URL to a directory path.
   * 
   * @param importMetaUrl - The import meta URL to convert.
   * @returns The directory path corresponding to the import meta URL.
   */
  static DirName(importMetaUrl: string): string {
    return Path.dirname(fileURLToPath(importMetaUrl));
  }

  /**
   * Reads a JSON file and parses its contents into an object.
   * 
   * @param jsonFileName - The name of the JSON file to read.
   * @returns The parsed contents of the JSON file as an object.
   */
  static getJSONFileContentsAsObject<ContentType>(jsonFileName: string) {
    const path = ReplUtil.getAbsolutePath(jsonFileName);
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as ContentType;
  }

  /**
   * Converts a relative path to an absolute path.
   * 
   * @param p - The path to convert.
   * @returns The absolute path.
   */
  static getAbsolutePath(p: string) {
    if (Path.isAbsolute(p)) {
      return p;
    }

    const __dirname = process.cwd();
    return Path.join(__dirname, p);
  }

  /**
   * Merges the properties of the `updates` object into the `current` object.
   * If a property in `updates` is an object and the corresponding property in `current` is also an object,
   * the function will recursively merge their properties.
   * 
   * @param current - The target object to merge properties into. If null or undefined, a warning is logged and the function returns.
   * @param updates - The source object containing properties to merge into the `current` object. If null or undefined, the function returns without making any changes.
   * @returns The merged `current` object.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static merge(current: any, updates: any) {
    if (!current) {
      console.log('Warning! Cannot merge with null object.');
      return;
    }

    if (!updates) {
      return;
    }

    for (const key of Object.keys(updates)) {
      if (
        !Object.prototype.hasOwnProperty.call(current, key) ||
        typeof updates[key] !== 'object'
      ) {
        current[key] = updates[key];
      } else {
        ReplUtil.merge(current[key], updates[key]);
      }
    }

    return current;
  }

  /**
   * A decorator function that adds a help text metadata to a class or a class property.
   * This help text will be displayed when the user types `.help <instance_variable>` 
   * or `.help <instance_variable>.<member>` in the REPL.
   * 
   * @param help - The help text to be added as metadata.
   * @returns A decorator function that applies the help text metadata.
   * 
   * @example
   * ```typescript
   * @ReplUtil.HelpText('This is a sample class')
   * class SampleClass {
   *   @HelpText('This is a sample method')
   *   sampleMethod() {
   *     // method implementation
   *   }
   * }
   * ```
   */
  static HelpText(help: string) {
    return function (target: Object, propertyKey?: string) {
      if (propertyKey) {
        Reflect.defineMetadata('help', help, target, propertyKey);
      } else {
        Reflect.defineMetadata('help', help, target);
      }
    };
  }

  /**
   * A function that retrieves the help text metadata from a class or a class property.
   * 
   * @param target - The class or class property from which to retrieve the help text metadata.
   * @param propertyKey - The property key of the class property from which to retrieve the help text metadata.
   * @returns The help text metadata.
   * 
   * @example
   * ```typescript
   * const classHelp = ReplUtil.getHelpText(SampleClass);
   * const methodHelp = ReplUtil.getHelpText(SampleClass, 'sampleMethod');
   * ```
   */
  static getHelpText(target: Object, propertyKey?: string): string {
    if (target.constructor?.name !== 'Function') {
      target = target.constructor;
    }

    if (propertyKey) {
      return Reflect.getMetadata('help', target, propertyKey);
    } else {
      return Reflect.getMetadata('help', target);
    }
  }

  /**
   * Checks if the target object or its property has associated help text.
   *
   * @param target - The object to check for help text.
   * @param propertyKey - Optional. The property key to check for help text.
   * @returns `true` if help text is found, otherwise `false`.
   */
  static hasHelpText(target: Object, propertyKey?: string): boolean {
    return !!ReplUtil.getHelpText(target, propertyKey);
  }

  static logErrorMessage(message: string) {
    console.error(chalk.red(message));
  }
}
