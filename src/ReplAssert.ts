import {assert} from 'chai';
import chalk from 'chalk';
import {TestReport} from './TestReport';
import {ReplUtil} from './ReplUtil';

type AssertStatic = typeof assert;

class ReplAssert {
  static successMessageHandler = (assertion: string) => {
    // TestRunner.AssertionSuccessHandler(assertion);
    console.log(chalk.yellow(`Success!: ${assertion}`));
  };
 
  static failureMessageHandler(
    assertion: string,
    e: Error,
    report?: TestReport
  ) {
    const lineNumber = ReplAssert.getLineNumber(e);
    const msg = `Failed!: ${assertion}: line ${lineNumber}`;
    //console.log(chalk.red(`msg: ${msg}`));
    ReplUtil.logErrorMessage(`msg: ${msg}`);
    const lineNumberAvailable = !isNaN(lineNumber); 
    if (!lineNumberAvailable) {
      console.log(chalk.red(e.stack));
    }
    // console.log(chalk.red(`e: ${JSON.stringify(e)}`));

    if (report) {
      report.addAssertionResult({
        msg: e.message,
        assertionText: assertion,
        success: false,
        lineNumber: lineNumberAvailable ? lineNumber : 1,
        showStackTrace: !lineNumberAvailable,
        error: e,
      });
    }
 
    return e;
  }

  static getLineNumber(e: Error): number {
    const matches = e.stack?.match(/at repl-app-script:(\d+):/);
    return Number(matches?.[1]);
  }

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
   *  that is to create hashes of assert statements and keep track of which assert
   *  is on which line.
   */
  static createAssertProxy(obj: AssertStatic, report?: TestReport) {
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
                  report,
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
      .map(a => (typeof a === 'string' ? `'${a}'` : JSON.stringify(a)))
      .join(', ');
  }

  static getInstance(report?: TestReport) {
    return ReplAssert.createAssertProxy(assert, report);
  }
}

const replAssert = ReplAssert.getInstance();
export {replAssert as assert, ReplAssert};
