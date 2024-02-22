import {ReplUtil} from '../ReplUtil';
import Path from 'path';
import {ParsedArgs} from '../CommandLineArgsParser';
import * as fs from 'fs';

export type ReplConfigType = ParsedArgs['values'];

export class ReplConfig {
  private static _config: ReplConfigType;

  static get config() {
    if (!ReplConfig._config) {
      ReplConfig._config = ReplConfig.getConfig();
    }
    return ReplConfig._config;
  }

  static getConfigFilePath() {
    return Path.join(ReplUtil.DirName(import.meta.url), 'ReplConfig.json');
  }

  static getConfig() {
    const configFile = ReplConfig.getConfigFilePath();

    return ReplUtil.getJSONFileContentsAsObject<ReplConfigType>(configFile);
  }

  static getConfigValue(configKey: string) {
    return ReplConfig.config[configKey];
  }
 
  static setConfigValues(configValues: ReplConfigType) {
    let config = ReplConfig.config;

    config = {
      ...config,
      ...configValues,
    };

    if (JSON.stringify(config) === JSON.stringify(ReplConfig.getConfig())) {
      return;
    }

    ReplConfig._config = config;
    const configFilePath = ReplConfig.getConfigFilePath();
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
