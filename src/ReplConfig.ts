import {ReplUtil} from './ReplUtil';
import Path from 'path';

type ReplConfigType = {
  initFiles?: [];
  report?: {
    generate: boolean;
    folder?: string;
    filePath?: string;
  };
};

export class ReplConfig {
  private static _config: ReplConfigType;

  static get config() {
    if (!ReplConfig._config) {
      console.log('Getting config...');
      ReplConfig._config = ReplConfig.getConfig();
    }
    return ReplConfig._config;
  }

  static getConfig() {
    const configFile = Path.join(
      ReplUtil.DirName(import.meta.url),
      'ReplConfig.json'
    );

    return ReplUtil.getJSONFileContentsAsObject<ReplConfigType>(configFile);
  }

  static getReportFilePath() {
    const config = ReplConfig.config;
    const filePath = config?.report?.filePath ?? 'MadeUpTestReport_${datetime}';
    const date = new Date();
    const isoDate = date.toISOString();
    const datetime = isoDate
      .replace(/[-:]/g, '')
      .replace(/T/, '_')
      .replace(/Z/, '')
      .split('.')[0];

    return filePath.replace(/\${datetime}/g, datetime);
  }
}
