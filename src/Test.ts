import * as vm from 'vm';
import * as fs from 'fs';
import {ReplAssert} from './ReplAssert';
import {TestReport} from './TestReport';

export type ScriptPaths = {fullPath: string, shortPath: string};

/**
 * The `Test` class is responsible for running a test script in a given context and capturing the test report.
 */
export class Test {
  filePath: string;
  testReport: TestReport;

  /**
   * Constructs a new `Test` instance.
   * 
   * @param scriptPaths - An object containing the full and short paths of the script to be tested.
   */
  constructor(scriptPaths: ScriptPaths) {
    this.filePath = scriptPaths.fullPath;
    this.testReport = new TestReport(scriptPaths.shortPath);
  }

  /**
   * Runs the test script in the provided context and linker, and returns the test report.
   * 
   * @param context - The VM context in which the test script will be executed.
   * @param linker - The VM module linker used to link the test script.
   * @returns A promise that resolves to the test report.
   */
  async run(context: vm.Context, linker: vm.ModuleLinker): Promise<TestReport> {
    const fileContents = await fs.promises.readFile(this.filePath, 'utf-8');
    this.testReport.testContent = fileContents;

    // Override the current assert definition with a test-specific instance
    // so that we can get a callback when an assertion fails
    // TODO: pass in a TestReport instance, not the whole test here.
    context.assert = ReplAssert.getInstance(this.testReport);
    context.setTitle = (title: string) => (this.testReport.title = title);
    context.setDescription = (description: string) =>
      (this.testReport.description = description);

    // IMPORTANT: do not modify fileContents before passing to
    // SourceTextModule, as that will affect identifying the correct lines
    // in test run reports.
    const scriptModule = new vm.SourceTextModule(fileContents, {
      context: context,
      identifier: 'repl-app-script',
    });

    await scriptModule.link(linker);

    console.log(`Running ${this.filePath}`);
    const startTime = Date.now();
    await scriptModule.evaluate();
    const endTime = Date.now();
    this.testReport.runTime = endTime - startTime;
    return this.testReport;
  }
}
