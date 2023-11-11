import * as vm from 'vm';
import * as fs from 'fs';
import {ReplAssert} from './ReplAssert';

export class Test {
  filePath: string;
  result: boolean;

  async run(context: vm.Context, linker: vm.ModuleLinker) {
    const fileContents = await fs.promises.readFile(this.filePath, 'utf-8');

    // Important: do not modify fileContents before passing to
    // SourceTextModule, as that will affect identifying the correct lines
    // in test run reports.
    context.assert = ReplAssert.getInstance(this);

    const bar = new vm.SourceTextModule(fileContents, {
      context: context,
      identifier: 'repl-app-script',
    });

    await bar.link(linker);

    console.log(`Running test ${this.filePath}`);
    await bar.evaluate();

    this.result = true;
    return this.result;
  }

  constructor(filePath: string) {
    this.filePath = filePath;
    this.result = false;
  }
}
