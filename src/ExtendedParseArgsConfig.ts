import {ParseArgsConfig} from 'util';

export interface ExtendedParseArgsConfig extends ParseArgsConfig {
  options: {
    [key: string]: {
      type: 'string' | 'boolean';
      multiple?: boolean;
      description?: string; // Optional description field
    };
  };
}
