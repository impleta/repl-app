import * as repl  from 'repl';
import * as vm from 'vm';
import * as fs from 'fs';
import * as Url from 'url';
import * as Path from 'path';
import {findUp} from 'find-up';

interface LooseObject {
  [key:string]:any
}

interface ReplicantConfig {
  libs: string[]
}

export class Replicant {
  
  static async start() {
    const startPath = Path.dirname(process.argv[1]);

    const configFile = await this.findFile('replicant.config.js', startPath);

    let replicantContext = {};
    if (configFile) {
      const configUrl = Url.pathToFileURL(configFile);

      replicantContext = await import(configUrl.href);
    }
    
    Replicant.loadContext(replicantContext);
  }

  static loadContext(replicantContext: LooseObject) {
    const args = process.argv.slice(2);

    if (args.length <= 0) {
      Object.keys(replicantContext).forEach(k => {
        (global as any)[k] = replicantContext[k];  
      });

      repl.start({});
    } else {
      const text = fs.readFileSync(args[0], 'utf-8');    
      vm.runInNewContext(text, replicantContext);
    }
  }
  
  static async getConfig():  Promise<ReplicantConfig> {
    let libs:string[] = [];
    let  config = {libs: libs};
    const configFile = await this.findFile('replicant.config.js');
    
    if (configFile) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    }

    return config;
  }

  static async findFile(filename: string, startPath = '.') {
    try {
      let filePath = await findUp(filename, {cwd: startPath});
      return filePath;
    } catch(err) {
      console.error(err);
      return null;
    }
  }
  
}
