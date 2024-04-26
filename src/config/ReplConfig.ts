import {ReplUtil} from '../ReplUtil';
import Path from 'path';
import {ParsedArgsValues} from '../CommandLineArgsParser';
import * as fs from 'fs';
import {Container} from 'typedi';

export type ReplConfigType = {
  initFiles: string[];
  report: {
    generate: boolean;
    folder: string;
    filePath: string;
    resultsFile: string;
  };
};

export class ReplConfig {
  private static _config: ReplConfigType;

  static get config() {
    if (!ReplConfig._config) {
      const conf = ReplConfig.getConfig();
      if (conf) {
        ReplConfig._config = conf;
      }
    }
    return ReplConfig._config;
  }

  static handleConfigOperation(replAppArgs?: ParsedArgsValues) {
    if (!replAppArgs) {
      return false;
    }

    const getConfigForKey = replAppArgs['get-config'] as string;

    if (getConfigForKey) {
      console.log(
        `${getConfigForKey}: ${JSON.stringify(
          ReplConfig.getConfigValue(getConfigForKey),
          null,
          2
        )}`
      );
      return true;
    }

    const setConfigForKey = replAppArgs['set-config'] as string;

    if (setConfigForKey) {
      const conf = ReplConfig.config;
      const keyValue = setConfigForKey.split(':');
      if (keyValue.length !== 2) {
        console.log('Usage: --set-value <key>:<value');
        return true;
      }

      let value: string | boolean = keyValue[1];
      if (/^true$/i.test(value)) {
        value = true;
      } else if (/^false$/i.test(value)) {
        value = false;
      }
      ReplConfig.setConfigValue(conf, keyValue[0], value);
      ReplConfig.setConfigValues(conf);
      return true;
    }

    return false;
  }

  static getConfigFilePath() {
    return Path.join(ReplUtil.DirName(import.meta.url), 'ReplConfig.json');
  }

  /**
   * Reads config from ReplConfig.json, and overrides with command-line args
   * @returns the configuration object
   */
  static getConfig(replAppArgs?: ParsedArgsValues) {
    const config = ReplConfig.getConfigFromFile();

    let argsConfig = {};

    for (const key in replAppArgs) {
      argsConfig = ReplConfig.setConfigValue(argsConfig, key, replAppArgs[key]);
    }

    ReplConfig._config = ReplUtil.merge(config, argsConfig) as ReplConfigType;

    Container.set('REPL-CONFIG', ReplConfig._config);
    return ReplConfig._config;
  }

  static getConfigFromFile() {
    const configFile = ReplConfig.getConfigFilePath();

    return ReplUtil.getJSONFileContentsAsObject<ReplConfigType>(configFile);
  }

  // from https://stackoverflow.com/a/69459511/6660206
  // Will be good to avoid using 'any'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getObjectValueFromStringPath(t: any, path: string) {
    return path.split('.').reduce((r, k: string) => r?.[k], t);
  }

  static getConfigValue(configKey: string) {
    return ReplConfig.getObjectValueFromStringPath(
      ReplConfig.config,
      configKey
    );
  }

  // from https://stackoverflow.com/a/69459511/6660206
  // Will be good to avoid using 'any'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static setConfigValue(config: any, path: string, value: any): any {
    if (path === '') return value;
    const [k, next] = path.split({
      [Symbol.split](s) {
        const i = s.indexOf('.');
        return i === -1 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
      },
    });

    if (config !== undefined && typeof config !== 'object')
      throw Error(`cannot set property ${k} of ${typeof config}`);

    return Object.assign(config ?? (/^\d+$/.test(k) ? [] : {}), {
      [k]: ReplConfig.setConfigValue(config?.[k], next, value),
    });
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
