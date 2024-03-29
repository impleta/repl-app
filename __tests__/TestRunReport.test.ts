// testRunReport.test.ts
import {expect, test, vi, beforeAll} from 'vitest';
import {TestRunReport} from '../src/TestRunReport';
import {TestReport} from '../src/TestReport';
import {Container} from 'typedi';
import {ReplUtil} from '../src/ReplUtil';
import * as fs from 'fs';
import * as Path from 'path';
import * as ejs from 'ejs';

// Mock the ReplAppArgs class
const MockReplAppArgs = {
  report: {
    generate: false,
    folder: '.',
    filePath: 'TestReport_${datetime}.html',
    resultsFile: null,
  },
};

ReplUtil.DirName = vi.fn(_ => 'mockDir');
const templateString = 'template string';

vi.mock('fs', () => ({
  readFileSync: vi.fn((a, b) => templateString),
  writeFileSync: vi.fn(),
}));

vi.mock('ejs', async importOriginal => {
  const actual = (await importOriginal()) as Object;
  return {
    ...actual,
    compile: vi.fn(a => {
      return vi.fn(obj => {
        return vi.fn();
      });
    }),
  };
});

// Create some sample test reports
const testReports: TestReport[] = [
  {
    success: true,
  },
  {
    success: false,
    error: 'some error',
    duration: 2000,
  },
];

// Create a test run report instance
const testRunReport = new TestRunReport(testReports);

// Set up the container with the mock repl app args
beforeAll(() => {
  Container.set('REPL-CONFIG', MockReplAppArgs);
});

test('getResults called when report-generate is false', () => {
  const result = testRunReport.getResult();

  expect(result).toHaveProperty('succeeded', false);
  expect(result).toHaveProperty('resultsFile', null);
});

// Test the getResult method with report generation enabled
test('getResult generates a report file when enabled', () => {
  // Get the mock repl app args from the container
  const replAppArgs = Container.get<typeof MockReplAppArgs>('REPL-CONFIG');

  // Enable the report generation and set the file path
  replAppArgs.report.generate = true;
  replAppArgs.report.filePath = 'TestReport_${datetime}.html';

  // Call the getResult method
  const result = testRunReport.getResult();

  // Expect the result to have a non-null resultsFile property
  expect(result).toHaveProperty('resultsFile');
  expect(result.resultsFile).not.toBeNull();

  expect(fs.readFileSync).toHaveBeenCalledWith(
    Path.join('mockDir', 'report.ejs'),
    'utf8'
  );

  // console.log(ejs.compile.getMockName());
  expect(ejs.compile).toHaveBeenCalled();

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    expect.stringMatching(/TestReport_\d{8}_\d{6}\.html/),
    expect.anything()
  );
});
