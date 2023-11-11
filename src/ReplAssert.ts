import {assert} from 'chai';
import chalk from 'chalk';
import {Test} from './Test';
// import {TestRunner} from './TestRunner';

type AssertStatic = typeof assert;

class ReplAssert {
  static successMessageHandler = (assertion: string) => {
    console.log(chalk.yellow(`Success!: ${assertion}`));
  };

  static failureMessageHandler = (assertion: string, e: Error, test?: Test) => {
    console.log(chalk.red(`Failed!: ${assertion}`));
    if (test) {
      // TODO:
      // test.assertionFailed(assertion, e);
    }
    // console.log(chalk.red(`Failed!: ${assertion}\r\n${JSON.stringify(e)}`));
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
  static createAssertProxy(obj: AssertStatic, testInstance?: Test) {
    return new Proxy(obj, {
      get(target: AssertStatic, prop: keyof AssertStatic) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              const args = ReplAssert.getArguments(argumentsList);
              const reconstructedAssertion = `assert.${prop}(${args})`;
              try {
                const ret = Reflect.apply(target, thisArg, argumentsList);
                ReplAssert.successMessageHandler(reconstructedAssertion);
                return ret;
              } catch (e) {
                ReplAssert.failureMessageHandler(
                  reconstructedAssertion,
                  e as Error,
                  testInstance
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

  static getInstance(testInstance?: Test) {
    return ReplAssert.createAssertProxy(assert, testInstance);
  }
}

const replAssert = ReplAssert.getInstance();
export {replAssert as assert, ReplAssert};
