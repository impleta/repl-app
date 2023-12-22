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
  }

  constructor(filePath: string) {
    this.filePath = filePath;
    this._testContent = '';
  }

  addAssertionResult(result: AssertionResult) {
    this.assertionResults.push(result);
    this.success &&= result.success;
  }

  getReportAsHtml() {
    return '';
  }
}
