import * as fs from 'fs';
import {fileURLToPath} from 'url';
import Path from 'path';

export class ReplUtil {

  static FileName(importMetaUrl: string): string {
    return fileURLToPath(importMetaUrl);
  }

  static DirName(importMetaUrl: string): string {
    return Path.dirname(ReplUtil.FileName(importMetaUrl));
  }

  static getJSONFileContentsAsObject<ContentType>(jsonFileName: string) {
    // TODO: For now, cannot use dynamic imports with JSON files without the experimental switch,
    // TODO: so simply read the file and deserialize.
    const path = ReplUtil.getAbsolutePath(jsonFileName);
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as ContentType;
  }

  static getAbsolutePath(p: string) {
    if (Path.isAbsolute(p)) {
      return p;
    }

    const __dirname = process.cwd();
    return Path.join(__dirname, p);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static merge(current: any, updates: any) {
    if (!current) {
      console.log('Warning! Cannot merge with null object.');
      return;
    }

    if (!updates) {
      return;
    }

    for (const key of Object.keys(updates)) {
      if (
        !Object.prototype.hasOwnProperty.call(current, key) ||
        typeof updates[key] !== 'object'
      ) {
        current[key] = updates[key];
      } else {
        ReplUtil.merge(current[key], updates[key]);
      }
    }

    return current;
  }

}
