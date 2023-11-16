export type AssertionResult = {
  msg: string;
  assertionText: string;
  success: boolean;
  lineNumber?: number;
  error?: Error;
};

export class TestReport {
  filePath: string;
  testContent: string;
  assertionResults: AssertionResult[] = [];
  success = true;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.testContent = '';
  }

  addAssertionResult(result: AssertionResult) {
    this.assertionResults.push(result);
    this.success &&= result.success;
  }

  getReportAsHtml() {
    return '';
  }
}
