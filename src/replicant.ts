import * as repl  from 'repl';
import * as vm from 'vm';
import * as fs from 'fs';
import {findUp} from 'find-up';

interface LooseObject {
  [key:string]:any
}

interface ReplicantConfig {
  libs: string[]
}

export class Replicant {
  
  static async start() {
    const config = await Replicant.getConfig();
    const libDefinitions = config.libs;
    const libImports: Promise<{}>[] = [];

    libDefinitions.forEach(async def => {
      const libPromise = import(def);
      libImports.push(libPromise);
    });

    let replicantContext = {};

    Promise.all(libImports).then(allLibs => {
      replicantContext = Object.assign({}, ...allLibs);
      Replicant.loadContext(replicantContext);
    });
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
    const configFile = await this.findFile('replicant.json');
    
    if (configFile) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    }

    return config;
  }

  static async findFile(filename: string) {
  // return null;
  
    try {
      let filePath = await findUp(filename);
      return filePath;
    } catch(err) {
      console.error(err);
      return null;
    }
  }
  
}