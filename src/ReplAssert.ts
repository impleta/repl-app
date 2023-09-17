import {assert} from 'chai';

type AssertStatic = typeof assert;

class ReplAssert {
  static createAssertProxy(obj: AssertStatic) {
    return new Proxy(obj, {
      get(target: AssertStatic, prop: keyof AssertStatic) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              try {
                const ret = Reflect.apply(target, thisArg, argumentsList);
                return ret;
              } catch (e) {
                console.log(`Failed!: assert.${prop}(${argumentsList.join()})`);

                if (e instanceof Error) {
                  console.log(e.stack);
                }
                return '';
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
export {replAssert as assert};
