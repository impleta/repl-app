import {expect, expectTypeOf, test} from 'vitest';
import {ReplConfig, ReplConfigType} from '../src/config/ReplConfig';

// TODO: These tests actually modify ReplConfig.json, ideally, we should mock file operations.

const defaultConfig = {
  initFiles: [],
  report: {
    generate: false,
    folder: '.',
    filePath: 'TestReport_${datetime}.html',
    resultsFile: null,
  },
};

test('getConfig returns the contents of ReplConfig.json', () => {
  const config = ReplConfig.getConfig();
  expectTypeOf(config).toEqualTypeOf<ReplConfigType>();

  expect(config, 'The default config file values are incorrect').toEqual(
    defaultConfig
  );
});

test('getConfigValue returns undefined if key is not found in config file', () => {
  const configValue = ReplConfig.getConfigValue('this-key-does-not-exist');

  expect(configValue).toBeUndefined();
});

test('getConfigValue returns the current value of specfied key', () => {
  const configValue = ReplConfig.getConfigValue('report.filePath');

  expect(configValue).toEqual('TestReport_${datetime}.html');
});

test('setConfigValue sets the value correctly', () => {
  let configValue = ReplConfig.getConfigValue('report.folder');
  expect(configValue).toBe('.');

  ReplConfig.setConfigValues({report: {folder: 'MyNewFolder'}});
  configValue = ReplConfig.getConfigValue('report.folder');
  expect(configValue).toBe('MyNewFolder');

  ReplConfig.setConfigValues(defaultConfig);
});
