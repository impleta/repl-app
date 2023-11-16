import {EOL} from 'os';
import {TestReport} from './TestReport';

export class TestRunReport {
  testReports: TestReport[] = [];

  getResult() {
    const resultBuilder: string[] = [`Running ${process.argv.join()}`];
    let runResult = true;
    this.testReports?.forEach(r => {
      resultBuilder.push(r.getReportAsHtml());
      runResult &&= r.success;
    });

    console.log(resultBuilder.join(EOL));

    return runResult;
  }
}
