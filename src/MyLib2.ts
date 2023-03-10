import {MyLib1} from './MyLib1';

export class MyLib2 {
  ML1: MyLib1;

  constructor() {
    this.ML1 = new MyLib1();
  }

  Method1(arg1: string) {
    console.log(`MyLib2.Method1("${arg1}") called.`);
  }

  async Method2(arg1: string) {
    const ml1 = new MyLib1();
    ml1.Method1(arg1);
    return await Promise.resolve('Awaited!');
  }
}
