#!/usr/bin/env node

import {ParseArgsConfig} from 'util';
import {ReplApp} from './src/ReplApp';
import { REPLServer } from 'repl';

const argsConfig: ParseArgsConfig = {
  options: {
    initFile: {
      type: 'string',
      multiple: true,
    },
    configFile: {
      type: 'string',
    },
  }
};

await ReplApp.start([], argsConfig);
