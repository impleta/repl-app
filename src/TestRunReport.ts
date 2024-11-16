import * as * as ejs from 'ejs';
import * as fs from 'fs';
import Path from 'path';

import {TestReport} from './TestReport';
import {ReplUtil} from './ReplUtil';
import {Container} from 'typedi';
import {ReplConfigType} from './config/ReplConfig';

export class TestRunReport {
  testReports: TestReport[] = [];

  constructor(testReports: TestReport[]) {
    this.testReports = testReports;
  }

  getResult() {
    const successfulTestsCount = this.testReports.filter(r => r.success).length;

    let results = {
      succeeded: successfulTestsCount === this.testReports.length,
      resultsFile: null as unknown,
    };

    const replConfig = Container.get<ReplConfigType>('REPL-CONFIG');

    if (!replConfig.report.generate) {
      return results;
    }

    const templatePath = Path.join(
      ReplUtil.DirName(import.meta.url),
      'report.ejs'
    );

    const date = new Date();
    const isoDate = date.toISOString();
    const formattedDate = isoDate
      .replace(/[-:]/g, '')
      .replace(/T/, '_')
      .replace(/Z/, '')
      .split('.')[0];

    let outputHtmlFileName = replConfig.report.filePath;

    outputHtmlFileName =
      outputHtmlFileName?.replace(/\${datetime}/g, formattedDate) ??
      `TestReport_${formattedDate}.html`;

    const outputHtmlPath = Path.join(process.cwd(), outputHtmlFileName);

    const templateString = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = ejs.compile(templateString);

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

    results = {
      ...results,
      resultsFile: outputHtmlPath,
    };

    return results;
  }
}
