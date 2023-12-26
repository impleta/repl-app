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
    let allTestsSucceeded = true;

    // get the top level ejs template
    // Set some of the test run data 
    // such as date time, command line args etc
    allTestsSucceeded = this.testReports?.every(r => r.success);
 
    const templatePath = Path.join(ReplUtil.DirName, 'report.ejs');
    const outputHtmlFileName = 'report.html';
    const outputHtmlPath = Path.join(process.cwd(), outputHtmlFileName);

    // Compile EJS template
    const templateString = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = ejs.compile(templateString);

    // Write the compiled HTML content to the output file
    fs.writeFileSync(
      outputHtmlPath,
      compiledTemplate({
        runResult: {
          allTestsSucceeded: allTestsSucceeded,
          date: new Date(),
        },
        testReports: this.testReports,
      })
    );
 
    return allTestsSucceeded;
  }
}
