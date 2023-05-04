#!/usr/bin/env node

import {ReplApp, ReplAppParams} from './src/ReplApp';
import {CommandLineArgsParser} from './src/CommandLineArgsParser';

const commandLineArgs = CommandLineArgsParser.getArgs();

const replAppParams: ReplAppParams = {
  initFilePaths: commandLineArgs?.values['ra_module'] as string[],
  scriptPaths: commandLineArgs?.positionals as string[],
};

ReplApp.start(replAppParams);