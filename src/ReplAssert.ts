import {assert} from 'chai';
import chalk from 'chalk';

type AssertStatic = typeof assert;

class ReplAssert {
  static successMessageHandler = (msg: string) => {
    console.log(chalk.yellow(msg));
  };

  static failureMessageHandler = (msg: string, e: Error) => {
    console.log(chalk.red(msg));
    return e;
  };

  /**
   * A proxy to intercept calls to function defined in chai.assert.
   *
   * This is used for
   *  1. Modifying the success and failure messages
   *  2. Determining which asserts (by line #) failed when running in batch mode so
   *     reports can be created appropriately.
   *
   * TODO:
   *  Currently, we cannot determine line # when an assertion succeeds. One way to achieve
   *  that is to use create hashes of assert statements and keep track of which assert
   *  is on which line.
   */
  static createAssertProxy(obj: AssertStatic) {
    return new Proxy(obj, {
      get(target: AssertStatic, prop: keyof AssertStatic) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              const args = ReplAssert.getArguments(argumentsList);
              try {
                const ret = Reflect.apply(target, thisArg, argumentsList);
                ReplAssert.successMessageHandler(
                  `Success!: assert.${prop}(${args})`
                );
                return ret;
              } catch (e) {
                ReplAssert.failureMessageHandler(
                  `Failed!: assert.${prop}(${args})`,
                  e as Error
                );
              }
            },
          });
        } else {
          return Reflect.get(target, prop);
        }
      },
    });
  }

  /**
   * Returns a comma-separated string of arguments for display purposes
   * Adds quotes if an argument is a string
   * @param argumentsList list of arguments
   */
  static getArguments(argumentsList: unknown[]): string {
    return argumentsList
      .map(a => (typeof a === 'string' ? `'${a}'` : a))
      .join(', ');
  }

}

const replAssert = ReplAssert.createAssertProxy(assert);
export {replAssert as assert, ReplAssert};
