import * as vm from 'vm';
import * as fs from 'fs';
import {ReplAssert} from './ReplAssert';
import {TestReport} from './TestReport';

export class Test {
  filePath: string;
  testReport: TestReport;

  async run(context: vm.Context, linker: vm.ModuleLinker) {
    const fileContents = await fs.promises.readFile(this.filePath, 'utf-8');
    this.testReport.testContent = fileContents;

    // override the current assert definition with a test specific instance
    // so that we can get a callback when an assertion fails
    // TODO: pass in a TestReport instance, not the whole test here.
    context.assert = ReplAssert.getInstance(this.testReport);

    // IMPORTANT: do not modify fileContents before passing to
    // SourceTextModule, as that will affect identifying the correct lines
    // in test run reports.
    const bar = new vm.SourceTextModule(fileContents, {
      context: context,
      identifier: 'repl-app-script',
    });

    await bar.link(linker);

    console.log(`Running test ${this.filePath}`);
    await bar.evaluate();

    return this.testReport;
  }

  constructor(filePath: string) {
    this.filePath = filePath;
    this.testReport = new TestReport(filePath);
  }
}
