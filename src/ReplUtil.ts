import {fileURLToPath} from 'url';
import path from 'path';

export class ReplUtil {

  static get FileName(): string {
    return fileURLToPath(import.meta.url);
  }

  static get DirName(): string {
    return path.dirname(ReplUtil.FileName);
  }
}
