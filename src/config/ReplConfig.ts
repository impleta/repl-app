import {ReplUtil} from '../ReplUtil';
import Path from 'path';
import {ParsedArgs, ReplAppArgs} from '../CommandLineArgsParser';
import * as fs from 'fs';
import {Container} from 'typedi';
import { ReplApp } from 'src/ReplApp';

export type ReplConfigType = ParsedArgs['values'];

export class ReplConfig {
  
  private static _config: ReplConfigType;

  static get config() {
    if (!ReplConfig._config) {
      ReplConfig._config = ReplConfig.getConfig();
    }
    return ReplConfig._config;
  }

  static handleConfigOperation() {
    const replAppArgs = Container.get<ReplAppArgs>('REPL-APP-ARGS');
    const getConfigForKey = replAppArgs.parsedArgs.values[
      'get-config'
    ] as string;
    if (getConfigForKey) {
      console.log(`${getConfigForKey}: ${ReplConfig.config[getConfigForKey]}`);
      return true;
    }

    return false;
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

    // don't save if there are no changes
    if (JSON.stringify(config) === JSON.stringify(ReplConfig.getConfig())) {
      return;
    }

    ReplConfig._config = config;
    const configFilePath = ReplConfig.getConfigFilePath();
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(config, null, '\t'),
      'utf-8'
    );
  }
}
