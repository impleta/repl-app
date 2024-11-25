import * as vm from 'vm';
import {Test} from './Test';
import {TestRunReport} from './TestRunReport';

/**
 * Manages a Test Run (each invocation of the repl with one or
 * more script files specified in the command line).
 *
 *
 */
export class TestRunner {
  files: string[];
  context: vm.Context;
  linker: vm.ModuleLinker;
  result: boolean[] = [];

  // static AssertionSuccessHandler = ()
  constructor(files: string[], context: {[key: string]: unknown}) {
    this.files = files;
    this.context = context;

    this.linker = async (specifier: string, referencingModule: vm.Module) => {
      // This is just boiler-plate, and will never get called unless there's
      // an import statement in a script file, which will result in an exception
      // being thrown
      /*
      if (specifier === 'foo') {
        return new vm.SourceTextModule('', {
          context: referencingModule.context,
        });
      }
      */
      throw new Error(
        `Unable to resolve dependency: ${specifier}; ${referencingModule}`
      );
    };
  }

  async run() {
    const promises = this.files.map(async (f: string) => {
      const test = new Test(f);
      const context = vm.createContext({console, ...this.context});
      return await test.run(context, this.linker);
    });

    const results = await Promise.all(promises);
    const testRunReport = new TestRunReport(results);

    return testRunReport.getResult();
  }
}
