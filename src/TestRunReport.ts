import ejs from 'ejs';
import * as fs from 'fs';
import Path from 'path';

import {TestReport} from './TestReport';
import {ReplUtil} from './ReplUtil';

export class TestRunReport {
  testReports: TestReport[] = [];

  constructor(testReports: TestReport[]) {
    this.testReports = testReports;
  }

  getResult() {
    const successfulTestsCount = this.testReports.filter(r => r.success).length;

    const templatePath = Path.join(ReplUtil.DirName, 'report.ejs');
    const date = new Date();
    const isoDate = date.toISOString();
    const formattedDate = isoDate
      .replace(/[-:]/g, '')
      .replace(/T/, '_')
      .replace(/Z/, '')
      .split('.')[0];

    const outputHtmlFileName = `TestReport_${formattedDate}.html`;

    const outputHtmlPath = Path.join(process.cwd(), outputHtmlFileName);

    // Compile EJS template
    const templateString = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = ejs.compile(templateString);

    // Write the compiled HTML content to the output file
    fs.writeFileSync(
      outputHtmlPath,
      compiledTemplate({
        runResult: {
          title: `Test Report ${formattedDate}`,
          date: date.toLocaleString(),
          totalTests: this.testReports.length,
          successfulTestsCount: successfulTestsCount,
        },
        testReports: this.testReports,
      })
    );

    return successfulTestsCount === this.testReports.length;
  }
}
