import {assert} from 'chai';

type AssertStatic = typeof assert;

class ReplAssert {
  static successMessageHandler = (msg: string) => {
    console.log(msg);
  };

  static failureMessageHandler = (msg: string, e: Error) => {
    console.log(msg, e);
    return e;
  };

  static createAssertProxy(obj: AssertStatic) {
    return new Proxy(obj, {
      get(target: AssertStatic, prop: keyof AssertStatic) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              try {
                const ret = Reflect.apply(target, thisArg, argumentsList);
                ReplAssert.successMessageHandler(
                  `Success!: assert.${prop}(${argumentsList.join()})`
                );
                return ret;
              } catch (e) {
                ReplAssert.failureMessageHandler(
                  `Failed!: assert.${prop}(${argumentsList.join()})`,
                  e as Error
                );
              }
            },
          });
        } else {
          return Reflect.get(target, prop);
        }
      },
    });
  }
}

const replAssert = ReplAssert.createAssertProxy(assert);
export {replAssert as assert, ReplAssert};
