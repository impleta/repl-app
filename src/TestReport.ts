import {EOL} from 'os';

export type AssertionResult = {
  msg: string;
  assertionText: string;
  success: boolean;
  lineNumber?: number;
  error?: Error;
};

export class TestReport {
  filePath: string;
  private _testContent = '';
  assertionResults: AssertionResult[] = [];
  success = true;
  lines: string[] = [];

  get testContent(): string {
    return this._testContent;
  }

  set testContent(content: string) {
    this._testContent = content;
    this.lines = this._testContent.split(EOL);

    this.assertionResults = Array<AssertionResult>(this.lines.length).fill({
      msg: '',
      assertionText: '',
      success: true,
    });
  }

  constructor(filePath: string) {
    this.filePath = filePath;
    this._testContent = '';
  }

  addAssertionResult(result: AssertionResult) {
    if (result.lineNumber) {
      this.assertionResults[result.lineNumber - 1] = result;
    }

    this.success &&= result.success;
  }

  getReportAsHtml() {
    return '';
  }
}
