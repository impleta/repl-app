import {ExtendedParseArgsConfig} from './ExtendedParseArgsConfig';

export const replArgsConfig: ExtendedParseArgsConfig = {
  options: {
    initFile: {
      type: 'string',
      multiple: true,
      description: 'Path(s) to initialization file(s)',
    },
    configFile: {
      type: 'string',
      description: 'Path to the configuration file',
    },
    'report.generate': {
      type: 'boolean',
      description: 'Generate a report after execution.',
    },
    'report.folder': {
      type: 'string',
      description: 'Folder to save the generated report',
    },
    'report.filePath': {
      type: 'string',
      description: 'File path to save the generated report',
    },
    'get-config': {
      type: 'string',
      description: 'Retrieve a specific configuration value',
    },
    'set-config': {
      type: 'string',
      description: 'Set a specific configuration value',
    },
  },
};
